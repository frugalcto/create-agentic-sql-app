import { Link } from "react-router-dom";

import { DEMO_PROJECT_ID } from "../constants.js";

export function HomeRoute() {
  return (
    <section>
      <h1>__PROJECT_NAME__</h1>
      <p>PostgreSQL owns business logic. This UI renders API contract data.</p>
      <Link to={`/sample-dashboard?projectId=${DEMO_PROJECT_ID}`}>
        Open sample dashboard
      </Link>
    </section>
  );
}
