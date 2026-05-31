# Database Layer

- Default provider: SQLite (`file:./src/database/dennyqa.sqlite`)
- Future provider: PostgreSQL via the same provider abstraction contract
- Current assets:
  - `schema.sql`: initial schema for projects, runs, and bug insights
  - `client.ts`: provider-aware client descriptor
