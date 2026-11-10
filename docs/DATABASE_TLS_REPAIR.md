# Masoom Workspace local database repair

This guide applies to the `local-testing` branch only. Never commit `.env.local`, a database password, or a private CA certificate.

## What was repaired

The server now validates the PostgreSQL URL, rejects ambiguous TLS settings in the URL, supports an explicitly trusted database CA PEM file, and handles idle pool errors without crashing the Node.js process. TLS verification remains enabled.

## Local setup

1. In Supabase **Connect**, copy the current **Session pooler** connection URI for the Workspace project. Use its actual hostname and port. Replace the password placeholder locally. Percent-encode special characters in the password.
2. In `apps/web/.env.local`, set `WORKSPACE_DATABASE_URL=postgresql://...` **once**. Keep the Supabase public URL and publishable key as configured.
3. If the server reports `SELF_SIGNED_CERT_IN_CHAIN`, first inspect the certificate chain and check for antivirus, VPN, or proxy TLS interception. Obtain the **correct trusted CA PEM** from the database provider or your trusted network administrator. Do not blindly trust a certificate downloaded from an unknown source.
4. Save the verified CA PEM **outside the Git repository**, for example `C:\\Users\\Administrator\\workspace-db-ca.pem`, then add `WORKSPACE_DATABASE_CA_FILE=C:/Users/Administrator/workspace-db-ca.pem` to `.env.local`.
5. Do not put `sslmode`, `sslrootcert`, `sslcert`, or `sslkey` in the connection URI; these can override explicit Node PostgreSQL TLS settings.
6. Stop other Workspace development servers. Run `npm.cmd run typecheck`, `npm.cmd run build`, and `npm.cmd run dev` from `apps/web`.

Do **not** use `NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized:false`, or `sslmode=no-verify`.

## Interpreting errors

- `ENOTFOUND`: invalid hostname or DNS problem.
- `SELF_SIGNED_CERT_IN_CHAIN`: untrusted presented certificate chain. Verify issuer and CA, then configure the trusted CA PEM if appropriate.
- `28P01`: credentials rejected.
- `42P01`: required table or schema missing.
- `42501`: database role lacks permission.
- HTTP `401`: user not signed in.
- HTTP `403`: signed in but no approved Workspace membership.
- HTTP `503`: server-side database/configuration error.

A successful TCP port test alone does not prove TLS or database login works.

## Security follow-up

If a database password was pasted into a chat or logs, rotate it and update any other clients using the same database password. Check that the GitHub repository is private before adding employee data.

## Scope

This commit changes the connection layer only. It has **not** been verified against the user's local network or database and does not guarantee the certificate error is fixed until the correct trusted CA is configured.
