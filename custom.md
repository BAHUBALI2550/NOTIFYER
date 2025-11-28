in case of running in docker, replace scripts in backend/package.json with this:
"scripts": {
    "dev": "node src/server.js",
    "prisma:generate": "npx prisma generate",
    "prisma:migrate": "npx prisma migrate dev"
  },

  else, if on render
  "scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "migrate": "prisma migrate deploy",
  "generate": "prisma generate"
}
