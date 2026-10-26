/**
 * Central API configuration for the compliance backend.
 *
 * The backend (kyc-backend) serves all dashboard data: KYC status,
 * DID/VC documents, and eERC encrypted-transfer execution.
 *
 * Override with VITE_API_URL in a .env file; defaults to the local
 * dev backend on port 3001 (see kyc-backend/README or LOCAL_DEV.md).
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function apiUrl(path: string): string {
	return `${API_BASE_URL}${path}`;
}
