# dbt_smoke
Tiny practice project: seed -> staging view -> mart table, with tests.

dbt Cloud setup: Project settings > Repository subdirectory = `dbt_smoke`; use the existing Databricks connection.
CI practice: create a CI job (Deploy > Jobs) running `dbt build --select state:modified+ --defer`, 
and a prod job running `dbt build`. See `.github/workflows/dbt-ci.yml` for an API-triggered alternative.
