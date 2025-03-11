const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Load Swagger document
let service1Docs;
try {
  service1Docs = require(`./utils/Service1Api.json`);
} catch (error) {
  console.log("Error loading Swagger document: ", error);
}

const options = {};

app.use(
  "/service1",
  swaggerUi.serveFiles(service1Docs, options),
  swaggerUi.setup(service1Docs)
);

app.use(express.static(path.join(__dirname, "public")));

// Start the serverW
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Docs running on http://localhost:${PORT}`);
});
