import { Link, useParams } from "react-router-dom";

const StationDetails = () => {
  const { id } = useParams();

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>Station Details</h1>
          <p>Station ID: {id}</p>
        </div>
        <div>
          <Link to="/" className="secondary-button">
            Back to dashboard
          </Link>
        </div>
      </div>

      <section className="detail-grid">
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            margin: "40px 0",
          }}
        >
          <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
            🚧 Work in Progress
          </h2>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
            This page is currently under development. You'll see the detailed station
            information including historical trends and pollutant analysis here in the
            future.
          </p>
          <p style={{ fontSize: "14px", color: "#999" }}>
            Check back soon for more detailed air quality insights!
          </p>
        </div>
      </section>
    </main>
  );
};

export default StationDetails;
