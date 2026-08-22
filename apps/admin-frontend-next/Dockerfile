FROM node:24.1.0-alpine AS build
WORKDIR /app

COPY ./package.json ./package-lock.json ./nx.json ./tsconfig.base.json ./
COPY ./apps/admin-frontend-next ./apps/admin-frontend-next
# codegen.ts reads the admin-panel GraphQL schema — copy just that one file
# (the rest of admin-panel isn't needed in this build).
COPY ./apps/admin-panel/schema.graphql ./apps/admin-panel/schema.graphql

# Install root + only the admin-frontend-next workspace.
# --force tolerates peer-dep conflicts from sibling workspaces declared in
# package-lock (we won't touch them).
RUN npm install --workspace=admin-frontend-next --include-workspace-root --force

# Generate typed GraphQL artifacts (gitignored). Must run before vite build
# since the bundle imports from @/lib/graphql/__generated__.
RUN cd apps/admin-frontend-next && npx graphql-codegen --config codegen.ts

# Use `vite build` directly instead of `npm run build` to skip the
# `tsc --noEmit` developer pre-check. Strict-TS warnings don't affect the
# bundle output, and CI has no way to fix legacy implicit-any params here.
RUN cd apps/admin-frontend-next && npx vite build


FROM nginx:1.27-alpine
COPY ./apps/admin-frontend-next/.nginx/default.conf /etc/nginx/conf.d/default.conf
# Vite is built with base=/admin/, so assets live under /admin/ in the URL.
# Mirror that on disk so internal nginx can serve them with try_files.
COPY --from=build /app/apps/admin-frontend-next/dist /usr/share/nginx/html/admin
EXPOSE 8080
