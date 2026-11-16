# Security Specification: Al Azhar Islamic Organization Firestore Database

## 1. Data Invariants
1. Organization document path `/organizations/{orgId}` must have a valid sanitized ID (maximum 128 characters, alphanumerics and hyphens/underscores).
2. Public users and members across devices can read `/organizations/{orgId}` to view notices, member lists, financial transparency, and active projects.
3. Mutations (updates/creates) on `/organizations/{orgId}` must strictly retain the organization identity and validate incoming data structure.
4. Client application enforces role-based access control, requiring admin authentication for member deletion, notice creation/deletion, financial mutations, and project editing.
5. All sensitive credentials (such as Google Drive tokens or Admin passwords) remain strictly isolated in memory and client-side password hashes, never exposed as plaintext Firestore public documents.

## 2. Dirty Dozen Payloads (Adversarial Tests)
1. **ID Injection:** Attempting to get or write to `/organizations/../../evil_collection` or oversized ID (>128 chars). Expected: PERMISSION_DENIED.
2. **Global Catch-all Violation:** Attempting to read `/random_secret_vault/doc`. Expected: PERMISSION_DENIED.
3. **Ghost Collection List:** Attempting to execute `list` query across root collection `/organizations`. Expected: PERMISSION_DENIED.
4. **Delete Organization Root:** Attempting to call `deleteDoc` on `/organizations/al_azhar`. Expected: PERMISSION_DENIED.
5. **Unauthorized Admin Write:** Writing to `/admins/attacker_id` without super admin privileges. Expected: PERMISSION_DENIED.
6. **Corrupt Organization Payload:** Writing a document without `organization` title. Expected: PERMISSION_DENIED.
7. **Negative Target Amounts:** Writing negative financial numbers for income or target amounts. Expected: PERMISSION_DENIED.
8. **Oversized String Bomb:** Attempting to write a 2MB junk title to crash mobile parser. Expected: PERMISSION_DENIED.
9. **SQL/Script Injection in ID:** Attempting ID with `<script>` tags. Expected: PERMISSION_DENIED.
10. **Test Connection Write:** Attempting to overwrite `/test/connection`. Expected: PERMISSION_DENIED.
11. **Impersonation Attack:** Altering organization name to third-party name during update. Expected: PERMISSION_DENIED.
12. **Public Admin Escalation:** Attempting to list all admin accounts. Expected: PERMISSION_DENIED.

## 3. Test Invariant Coverage
All 12 adversarial vectors are intercepted by the strict path validation `isValidId()`, write gates, and the global deny-all policy.
