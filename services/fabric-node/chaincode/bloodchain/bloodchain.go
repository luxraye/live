// Package main implements the Bloodchain chaincode for Hyperledger Fabric.
//
// This chaincode anchors verified blood donation events on the distributed
// ledger for the Republic of Botswana's national blood-supply platform.
//
// IMMUTABILITY GUARANTEE:
//   There is deliberately NO update, delete, or overwrite function for
//   donation records. The only write function is RecordDonation. If an
//   operator makes a data entry error, the correct action is to record a
//   NEW corrective entry with notes — never to modify the original.
//
// PRIVACY GUARANTEE:
//   donorHash and operatorHash are SHA-256 hashes of Clerk user IDs,
//   computed by the api-server BEFORE reaching this chaincode. Raw user
//   IDs or any other PII must never be stored on the ledger.
package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	donationKeyPrefix = "DONATION_"
	donorKeyPrefix    = "DONOR_"
	donationKeyEnd    = "DONATION_~" // '~' sorts after all hex/uuid characters
)

// DonationRecord is the JSON document stored on the ledger for each
// verified blood donation.
type DonationRecord struct {
	TxID               string `json:"txId"`
	DonorHash          string `json:"donorHash"`          // SHA-256 of clerk_user_id
	CentreID           string `json:"centreId"`
	CentreName         string `json:"centreName"`
	District           string `json:"district"`
	BloodType          string `json:"bloodType"`
	DonatedAt          string `json:"donatedAt"`          // ISO 8601 UTC
	OperatorHash       string `json:"operatorHash"`       // SHA-256 of operator clerk_user_id
	BlockchainVerified bool   `json:"blockchainVerified"` // always true when on ledger
	LedgerTimestamp    string `json:"ledgerTimestamp"`    // set from ctx.GetStub().GetTxTimestamp()
}

// LedgerFeedResult is the paginated response shape for GetLedgerFeed.
type LedgerFeedResult struct {
	Records      []*DonationRecord `json:"records"`
	NextBookmark string            `json:"nextBookmark"`
	TotalCount   int32             `json:"totalCount"`
}

// LedgerStats is the response shape for GetLedgerStats.
type LedgerStats struct {
	TotalDonations int `json:"totalDonations"`
	UniqueDonors   int `json:"uniqueDonors"`
	UniqueCentres  int `json:"uniqueCentres"`
}

// BloodchainContract implements the donation-anchoring smart contract.
type BloodchainContract struct {
	contractapi.Contract
}

// RecordDonation writes a new immutable donation record to the ledger.
//
// Idempotency: if a record with the same txId already exists, the
// transaction is rejected so that network retries by the api-server can
// never create duplicate ledger entries.
func (c *BloodchainContract) RecordDonation(
	ctx contractapi.TransactionContextInterface,
	txId string,
	donorHash string,
	centreId string,
	centreName string,
	district string,
	bloodType string,
	donatedAt string,
	operatorHash string,
) (string, error) {
	if txId == "" {
		return "", fmt.Errorf("txId must not be empty")
	}

	stateKey := donationKeyPrefix + txId

	// Idempotency guard — reject duplicates.
	existing, err := ctx.GetStub().GetState(stateKey)
	if err != nil {
		return "", fmt.Errorf("failed to read world state: %w", err)
	}
	if existing != nil {
		return "", fmt.Errorf("DUPLICATE_TX: donation with txId %s already exists on the ledger", txId)
	}

	// Ledger timestamp comes from the transaction proposal so that all
	// endorsing peers deterministically record the same value.
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", fmt.Errorf("failed to get transaction timestamp: %w", err)
	}
	ledgerTimestamp := time.Unix(ts.Seconds, int64(ts.Nanos)).UTC().Format(time.RFC3339)

	record := DonationRecord{
		TxID:               txId,
		DonorHash:          donorHash,
		CentreID:           centreId,
		CentreName:         centreName,
		District:           district,
		BloodType:          bloodType,
		DonatedAt:          donatedAt,
		OperatorHash:       operatorHash,
		BlockchainVerified: true,
		LedgerTimestamp:    ledgerTimestamp,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return "", fmt.Errorf("failed to serialise donation record: %w", err)
	}

	// Primary state key: DONATION_<txId>
	if err := ctx.GetStub().PutState(stateKey, recordJSON); err != nil {
		return "", fmt.Errorf("failed to write donation record: %w", err)
	}

	// Secondary lookup key: DONOR_<donorHash>_<txId> → points to the txId,
	// enabling per-donor history queries via range scans.
	donorKey := donorKeyPrefix + donorHash + "_" + txId
	if err := ctx.GetStub().PutState(donorKey, []byte(txId)); err != nil {
		return "", fmt.Errorf("failed to write donor lookup key: %w", err)
	}

	// Emit an event so observer nodes / listeners can react in real time.
	if err := ctx.GetStub().SetEvent("DonationRecorded", recordJSON); err != nil {
		return "", fmt.Errorf("failed to emit DonationRecorded event: %w", err)
	}

	return string(recordJSON), nil
}

// GetDonation retrieves a single donation record by its txId.
func (c *BloodchainContract) GetDonation(
	ctx contractapi.TransactionContextInterface,
	txId string,
) (string, error) {
	data, err := ctx.GetStub().GetState(donationKeyPrefix + txId)
	if err != nil {
		return "", fmt.Errorf("failed to read world state: %w", err)
	}
	if data == nil {
		return "", fmt.Errorf("NOT_FOUND: donation with txId %s does not exist", txId)
	}
	return string(data), nil
}

// GetLedgerFeed returns a paginated feed of donation records.
//
// NOTE ON ORDERING: GetStateByRangeWithPagination returns keys in forward
// lexical order (by txId). For MVP we accept forward order; the gateway
// service sorts the page by donatedAt descending before serving it to the
// public. For a strictly reverse-chronological ledger-wide feed, store an
// additional composite key with an inverted-timestamp prefix, e.g.
// FEED_<9999999999 - unixSeconds>_<txId>, and range-scan that instead.
func (c *BloodchainContract) GetLedgerFeed(
	ctx contractapi.TransactionContextInterface,
	pageSize string,
	bookmark string,
) (*LedgerFeedResult, error) {
	var size int32
	if _, err := fmt.Sscanf(pageSize, "%d", &size); err != nil || size <= 0 {
		size = 20
	}
	if size > 100 {
		size = 100
	}

	iterator, metadata, err := ctx.GetStub().GetStateByRangeWithPagination(
		donationKeyPrefix, donationKeyEnd, size, bookmark,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query ledger range: %w", err)
	}
	defer iterator.Close()

	records := []*DonationRecord{}
	for iterator.HasNext() {
		kv, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate ledger results: %w", err)
		}
		var record DonationRecord
		if err := json.Unmarshal(kv.Value, &record); err != nil {
			return nil, fmt.Errorf("failed to deserialise record %s: %w", kv.Key, err)
		}
		records = append(records, &record)
	}

	return &LedgerFeedResult{
		Records:      records,
		NextBookmark: metadata.GetBookmark(),
		TotalCount:   metadata.GetFetchedRecordsCount(),
	}, nil
}

// GetLedgerStats iterates every donation record and computes aggregate
// statistics for the public dashboard.
//
// SCALABILITY NOTE: this is a full ledger scan — acceptable for MVP but
// slow at tens of thousands of records. In production, replace with a
// CouchDB rich query with indexes on donorHash and centreName, or maintain
// a stats state variable incremented inside RecordDonation.
func (c *BloodchainContract) GetLedgerStats(
	ctx contractapi.TransactionContextInterface,
) (*LedgerStats, error) {
	iterator, err := ctx.GetStub().GetStateByRange(donationKeyPrefix, donationKeyEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to query ledger range: %w", err)
	}
	defer iterator.Close()

	total := 0
	donors := map[string]struct{}{}
	centres := map[string]struct{}{}

	for iterator.HasNext() {
		kv, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate ledger results: %w", err)
		}
		var record DonationRecord
		if err := json.Unmarshal(kv.Value, &record); err != nil {
			return nil, fmt.Errorf("failed to deserialise record %s: %w", kv.Key, err)
		}
		total++
		donors[record.DonorHash] = struct{}{}
		centres[record.CentreName] = struct{}{}
	}

	return &LedgerStats{
		TotalDonations: total,
		UniqueDonors:   len(donors),
		UniqueCentres:  len(centres),
	}, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&BloodchainContract{})
	if err != nil {
		panic(fmt.Sprintf("error creating bloodchain chaincode: %v", err))
	}
	if err := chaincode.Start(); err != nil {
		panic(fmt.Sprintf("error starting bloodchain chaincode: %v", err))
	}
}
