#!/bin/bash
# 创建/更新 gaussdb_app 低权限角色（SQL API 专用，密码存 /opt/sql-api/.apppass）
# 用法: ./setup-role.sh <app_password>
set -e
APP_PASS="$1"
PG_PASS=$(cat /opt/sql-api/.pgpass)
docker exec -i -e PGPASSWORD="$PG_PASS" gaussdb-pg psql -U postgres -d gaussdb_learn -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gaussdb_app') THEN
    CREATE ROLE gaussdb_app LOGIN PASSWORD '${APP_PASS}';
  ELSE
    ALTER ROLE gaussdb_app PASSWORD '${APP_PASS}';
  END IF;
END
\$\$;
GRANT CONNECT ON DATABASE gaussdb_learn TO gaussdb_app;
GRANT ALL ON SCHEMA public TO gaussdb_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO gaussdb_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO gaussdb_app;
SQL
echo "gaussdb_app role ready"
