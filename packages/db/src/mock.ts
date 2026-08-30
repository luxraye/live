export const MOCK_CENTRES = [
  {
    id: 1,
    name: 'Princess Marina Hospital Blood Bank',
    kind: 'hospital',
    address: 'Corner Hospital Way & North Ring Rd',
    district: 'Gaborone',
    latitude: -24.6541,
    longitude: 25.9087,
    phone: '+267 362 1400',
    is_open: true,
    opens_at: '07:30:00',
    closes_at: '18:00:00',
    accepts_walk_ins: true,
    is_active: true,
    distance_km: 1.2,
  },
  {
    id: 2,
    name: 'National Blood Transfusion Service (NBTS) HQ',
    kind: 'clinic',
    address: 'Fairgrounds Plot 50381',
    district: 'Gaborone',
    latitude: -24.6725,
    longitude: 25.9231,
    phone: '+267 368 4200',
    is_open: true,
    opens_at: '08:00:00',
    closes_at: '17:00:00',
    accepts_walk_ins: true,
    is_active: true,
    distance_km: 3.4,
  },
  {
    id: 3,
    name: 'Nyangabgwe Referral Hospital',
    kind: 'hospital',
    address: 'Plot 1034, Somerset East',
    district: 'Francistown',
    latitude: -21.1712,
    longitude: 27.5083,
    phone: '+267 241 1000',
    is_open: true,
    opens_at: '07:00:00',
    closes_at: '19:00:00',
    accepts_walk_ins: true,
    is_active: true,
    distance_km: 420.0,
  },
  {
    id: 4,
    name: 'Scottish Livingstone Hospital',
    kind: 'hospital',
    address: 'Molepolole Main Highway',
    district: 'Molepolole',
    latitude: -24.4068,
    longitude: 25.4951,
    phone: '+267 592 0000',
    is_open: true,
    opens_at: '08:00:00',
    closes_at: '16:30:00',
    accepts_walk_ins: true,
    is_active: true,
    distance_km: 55.0,
  },
];

export const MOCK_REQUESTS = [
  {
    id: 1,
    blood_type: 'O-',
    priority: 'critical',
    facility_name: 'Princess Marina Hospital (ICU/Trauma)',
    description: 'Critical shortage: Urgent O- negative units required for emergency obstetric surgeries.',
    district: 'Gaborone',
    latitude: -24.6541,
    longitude: 25.9087,
    response_count: 14,
    is_open: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    age: '1 hour ago',
  },
  {
    id: 2,
    blood_type: 'A+',
    priority: 'planned',
    facility_name: 'Nyangabgwe Referral Hospital',
    description: 'Upcoming elective orthopedic surgery reserve replenishment.',
    district: 'Francistown',
    latitude: -21.1712,
    longitude: 27.5083,
    response_count: 8,
    is_open: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    age: '1 day ago',
  },
];

export const MOCK_ARTICLES = [
  {
    id: 1,
    title: 'Pre-Donation Nutrition: Maximizing Iron and Hemoglobin',
    slug: 'pre-donation-nutrition',
    topic: 'preparation',
    read_time_minutes: 4,
    icon_name: 'heart',
    published_at: new Date().toISOString(),
    body_markdown: '# Optimizing Your Blood Health\nEating iron-rich foods (spinach, beans, lean meats) and staying hydrated 24 hours before donating ensures a smooth session.',
  },
  {
    id: 2,
    title: 'Understanding the Universal Donor: Why O- Saves Lives in Traumas',
    slug: 'universal-donor-o-negative',
    topic: 'blood_type',
    read_time_minutes: 5,
    icon_name: 'shield',
    published_at: new Date().toISOString(),
    body_markdown: '# The Power of O- Negative\nO- blood can be safely given to recipients of any blood type during critical trauma resuscitation.',
  },
];

export const MOCK_ORDERS = [
  {
    id: 1,
    order_number: 'ORD-2026-1001',
    hospital_name: 'Princess Marina Hospital',
    ward_room: 'ICU Bed 4',
    doctor_clerk_user_id: 'dr_kgosi',
    patient_identifier: 'MRN-882194',
    blood_type: 'O-',
    component: 'prbc',
    units_requested: 2,
    urgency: 'stat_trauma',
    indication: 'Emergency trauma resuscitation',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
];

export const MOCK_UNITS = [
  {
    id: 1,
    bag_barcode: 'UNIT-BOTS-2026-9901-RBC',
    donor_hash: '3f8b89e3a7c5b1d9...',
    blood_type: 'O-',
    component_type: 'prbc',
    volume_ml: 250,
    status: 'tested_passed',
    vault_location: 'Cold Vault A · Shelf 1',
    is_reactive: false,
    expires_at: new Date(Date.now() + 35 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const MOCK_DOCS = [
  {
    id: 1,
    clerk_user_id: 'user_donor_001',
    first_name: 'Kabo',
    last_name: 'Tau',
    document_type: 'national_omang',
    document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    status: 'pending',
    verification_level: 1,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 2,
    clerk_user_id: 'user_donor_002',
    first_name: 'Lesego',
    last_name: 'Moloi',
    document_type: 'donor_card',
    document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    status: 'pending',
    verification_level: 1,
    created_at: new Date(Date.now() - 28800000).toISOString(),
  },
];

export class MockPool {
  private feedbackSubmissions: any[] = [];
  private dynamicOrders: any[] = [...MOCK_ORDERS];
  private dynamicRequests: any[] = [...MOCK_REQUESTS];
  private dynamicCentres: any[] = [...MOCK_CENTRES];
  private dynamicArticles: any[] = [...MOCK_ARTICLES];
  private dynamicUnits: any[] = [...MOCK_UNITS];
  private dynamicDocs: any[] = [...MOCK_DOCS];

  async query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
    const s = sql.toLowerCase().trim();

    // Centres
    if (s.includes('from donation_centres')) {
      if (s.includes('where id = $1')) {
        const found = this.dynamicCentres.find((c) => c.id === Number(params[0]));
        return { rows: found ? [found] : [] };
      }
      return { rows: this.dynamicCentres };
    }
    if (s.includes('insert into donation_centres')) {
      const newCentre = {
        id: this.dynamicCentres.length + 1,
        name: params[0],
        kind: params[1] || 'clinic',
        address: params[2] || '',
        district: params[3] || 'Gaborone',
        latitude: params[4] || -24.65,
        longitude: params[5] || 25.91,
        phone: params[6] || '+267 362 0000',
        is_open: true,
        accepts_walk_ins: params[9] ?? true,
        is_active: true,
        distance_km: 2.5,
      };
      this.dynamicCentres.push(newCentre);
      return { rows: [newCentre] };
    }

    // Articles
    if (s.includes('from health_articles')) {
      if (s.includes('where slug = $1')) {
        const found = this.dynamicArticles.find((a) => a.slug === params[0]);
        return { rows: found ? [found] : [] };
      }
      return { rows: this.dynamicArticles };
    }
    if (s.includes('insert into health_articles')) {
      const newArticle = {
        id: this.dynamicArticles.length + 1,
        title: params[0],
        slug: params[1],
        body_markdown: params[2] || '',
        topic: params[3] || 'general',
        read_time_minutes: params[4] || 5,
        icon_name: params[5] || 'heart',
        published_at: new Date().toISOString(),
      };
      this.dynamicArticles.unshift(newArticle);
      return { rows: [newArticle] };
    }

    // Network requests
    if (s.includes('from donation_requests')) {
      if (s.includes('where id = $1')) {
        const found = this.dynamicRequests.find((r) => r.id === Number(params[0]));
        return { rows: found ? [found] : [] };
      }
      return { rows: this.dynamicRequests };
    }
    if (s.includes('insert into donation_requests')) {
      const newReq = {
        id: this.dynamicRequests.length + 1,
        blood_type: params[0] || 'O-',
        priority: params[1] || 'critical',
        facility_name: params[2] || 'Princess Marina Hospital',
        description: params[3] || 'Urgent blood units required',
        district: params[4] || 'Gaborone',
        latitude: params[5] || -24.6541,
        longitude: params[6] || 25.9087,
        response_count: 0,
        is_open: true,
        created_at: new Date().toISOString(),
        age: 'Just now',
      };
      this.dynamicRequests.unshift(newReq);
      return { rows: [newReq] };
    }
    if (s.includes('insert into request_responses')) {
      const reqId = Number(params[0]);
      const found = this.dynamicRequests.find((r) => r.id === reqId);
      if (found) {
        found.response_count = (found.response_count || 0) + 1;
      }
      return { rows: [{ id: 1 }] };
    }

    // Verification Queue
    if (s.includes('from donor_documents')) {
      return { rows: this.dynamicDocs.filter((d) => d.status === 'pending') };
    }
    if (s.includes('update donor_documents set status=')) {
      const docId = Number(params[0]);
      const status = params[1];
      const found = this.dynamicDocs.find((d) => d.id === docId);
      if (found) found.status = status;
      return { rows: [{ updated: true }] };
    }

    // Stats Overview
    if (s.includes('count(*) from donor_profiles')) {
      return { rows: [{ count: 842 }] };
    }
    if (s.includes("count(*) from donor_documents where status = 'pending'")) {
      return { rows: [{ count: this.dynamicDocs.filter((d) => d.status === 'pending').length }] };
    }
    if (s.includes('count(*) from donation_centres')) {
      return { rows: [{ count: this.dynamicCentres.length }] };
    }
    if (s.includes('count(*) from donation_requests')) {
      return { rows: [{ count: this.dynamicRequests.filter((r) => r.is_open).length }] };
    }
    if (s.includes('count(*) from health_articles')) {
      return { rows: [{ count: this.dynamicArticles.length }] };
    }
    if (s.includes('count(*) from feedback_responses')) {
      return { rows: [{ count: this.feedbackSubmissions.length + 42 }] };
    }
    if (s.includes('sum(response_count)')) {
      const sum = this.dynamicRequests.reduce((acc, r) => acc + (r.response_count || 0), 0);
      return { rows: [{ sum: sum + 120 }] };
    }

    // Clinical Orders
    if (s.includes('from clinical_orders')) {
      return { rows: this.dynamicOrders };
    }
    if (s.includes('insert into clinical_orders')) {
      const orderNumber = params[0] || 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: this.dynamicOrders.length + 1,
        order_number: orderNumber,
        hospital_name: params[1],
        ward_room: params[2],
        doctor_clerk_user_id: params[3],
        patient_identifier: params[4],
        blood_type: params[5],
        component: params[6] || 'prbc',
        units_requested: params[7] || 1,
        urgency: params[8] || 'elective',
        indication: params[9] || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      this.dynamicOrders.unshift(newOrder);

      // Auto-propagate emergency STAT orders to donation requests feed
      if (newOrder.urgency === 'stat_trauma' || newOrder.urgency === 'urgent_surgery') {
        this.dynamicRequests.unshift({
          id: this.dynamicRequests.length + 1,
          blood_type: newOrder.blood_type,
          priority: 'critical',
          facility_name: newOrder.hospital_name,
          description: 'STAT Emergency Order ' + orderNumber + ': ' + newOrder.units_requested + ' units of ' + newOrder.blood_type + ' urgently needed at ' + newOrder.ward_room + ' (' + (newOrder.indication || 'Critical Resuscitation') + ')',
          district: 'Gaborone',
          latitude: -24.6541,
          longitude: 25.9087,
          response_count: 0,
          is_open: true,
          created_at: new Date().toISOString(),
          age: 'Just now',
        });
      }

      return { rows: [newOrder] };
    }

    // Transfusions
    if (s.includes('insert into transfusion_logs')) {
      return { rows: [{ id: 1, verified: true }] };
    }

    // Lab Inventory
    if (s.includes('from blood_units')) {
      return { rows: this.dynamicUnits };
    }

    // Feedback
    if (s.includes('insert into feedback_responses')) {
      const fb = { id: this.feedbackSubmissions.length + 1, payload: params };
      this.feedbackSubmissions.push(fb);
      return { rows: [fb] };
    }

    return { rows: [] };
  }
}
