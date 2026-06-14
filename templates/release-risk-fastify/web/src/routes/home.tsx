import { Link } from "react-router-dom";

import { DEMO_SERVICE_ID } from "../constants.js";

export function HomeRoute() {
  return (
    <section>
      <h1>__PROJECT_NAME__</h1>
      <p>PostgreSQL owns business logic. This UI renders API contract data.</p>
      <Link to={`/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`}>
        Open release risk dashboard
      </Link>
    </section>
  );
}
