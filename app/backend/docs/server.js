const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Load Swagger document
let golangTestingDocs;
try {
  golangTestingDocs = require(`./utils/golang-testing.json`);
} catch (error) {
  console.log("Error loading Swagger document: ", error);
}

const options = {};

app.use(
  "/golang-testing-docs",
  swaggerUi.serveFiles(golangTestingDocs, options),
  swaggerUi.setup(golangTestingDocs)
);

app.use(express.static(path.join(__dirname, "public")));

// Start the serverW
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Docs running on http://localhost:${PORT}`);
});
