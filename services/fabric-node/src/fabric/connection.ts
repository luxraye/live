/**
 * Hyperledger Fabric Gateway connection management.
 *
 * When FABRIC_MOCK_MODE=true, no connection is attempted and the mock
 * contract is used. Otherwise this module decodes the Base64 PEM material
 * from the environment, builds a gRPC client, and connects to the peer via
 * @hyperledger/fabric-gateway.
 *
 * If the peer is unreachable at startup, the service logs a clear error and
 * falls back to mock mode rather than crashing the process. Runtime peer
 * failures on individual transactions surface as LedgerUnavailableError
 * (HTTP 503) — they are NOT silently swallowed.
 */

import * as grpc from '@grpc/grpc-js';
import {
  connect,
  Contract,
  Gateway,
  Identity,
  Signer,
  signers,
} from '@hyperledger/fabric-gateway';
import * as crypto from 'node:crypto';
import { logger } from '../logger.js';

const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'bloodchain';

export interface FabricConnection {
  contract: Contract;
  gateway: Gateway;
  client: grpc.Client;
}

let connection: FabricConnection | null = null;

/** True when the service is operating against the in-memory mock ledger. */
export let usingMockMode = true;

/** Human-readable reason we are in the current mode (for /healthz). */
export let modeReason = 'FABRIC_MOCK_MODE=true';

function decodeBase64Pem(name: string): Buffer {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  const decoded = Buffer.from(value, 'base64');
  if (!decoded.toString('utf8').includes('-----BEGIN')) {
    throw new Error(`${name} does not decode to a PEM block — is it Base64-encoded?`);
  }
  return decoded;
}

function buildGrpcClient(): grpc.Client {
  const endpoint = process.env.FABRIC_PEER_ENDPOINT ?? 'localhost:7051';
  const hostAlias = process.env.FABRIC_PEER_HOST_ALIAS ?? 'peer0.org1.example.com';
  const tlsRootCert = decodeBase64Pem('FABRIC_TLS_CERT');

  const credentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(endpoint, credentials, {
    'grpc.ssl_target_name_override': hostAlias,
  });
}

function buildIdentity(): Identity {
  const mspId = process.env.FABRIC_MSP_ID ?? 'Org1MSP';
  const certificate = decodeBase64Pem('FABRIC_CERT');
  return { mspId, credentials: certificate };
}

function buildSigner(): Signer {
  const keyPem = decodeBase64Pem('FABRIC_KEY');
  const privateKey = crypto.createPrivateKey(keyPem);
  return signers.newPrivateKeySigner(privateKey);
}

/**
 * Initialise the Fabric connection (or decide to use mock mode).
 * Called once at startup from src/index.ts.
 */
export async function initFabric(): Promise<void> {
  const mockMode = (process.env.FABRIC_MOCK_MODE ?? 'true').toLowerCase() === 'true';

  if (mockMode) {
    usingMockMode = true;
    modeReason = 'FABRIC_MOCK_MODE=true';
    logger.info({ mode: 'mock' }, 'Fabric mock mode enabled — chaincode calls are simulated in-memory');
    return;
  }

  try {
    const client = buildGrpcClient();
    const gateway = connect({
      client,
      identity: buildIdentity(),
      signer: buildSigner(),
      // Sensible default timeouts for a healthcare gateway service.
      evaluateOptions: () => ({ deadline: Date.now() + 5_000 }),
      endorseOptions: () => ({ deadline: Date.now() + 15_000 }),
      submitOptions: () => ({ deadline: Date.now() + 5_000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60_000 }),
    });

    const network = gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    // Probe the peer with a lightweight evaluation so a dead endpoint is
    // detected at startup instead of on the first real transaction.
    await contract.evaluateTransaction('GetLedgerStats');

    connection = { contract, gateway, client };
    usingMockMode = false;
    modeReason = `connected to ${process.env.FABRIC_PEER_ENDPOINT} (channel=${CHANNEL_NAME}, chaincode=${CHAINCODE_NAME})`;
    logger.info(
      { mode: 'fabric', peer: process.env.FABRIC_PEER_ENDPOINT, channel: CHANNEL_NAME, chaincode: CHAINCODE_NAME },
      'Connected to Hyperledger Fabric peer',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    usingMockMode = true;
    modeReason = `peer unreachable at startup, fell back to mock mode: ${message}`;
    logger.error(
      { mode: 'mock-fallback', peer: process.env.FABRIC_PEER_ENDPOINT, error: message },
      'Failed to connect to Fabric peer — falling back to MOCK MODE. ' +
        'Ledger writes will NOT be anchored to a real blockchain until the peer is reachable and the service is restarted.',
    );
  }
}

/** Returns the live Fabric contract, or null when in mock mode. */
export function getFabricContract(): Contract | null {
  return connection?.contract ?? null;
}

/** Cleanly close the gateway and gRPC client on shutdown. */
export function closeFabric(): void {
  if (connection) {
    connection.gateway.close();
    connection.client.close();
    connection = null;
    logger.info('Fabric gateway connection closed');
  }
}
