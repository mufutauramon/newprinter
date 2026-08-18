export default function DeleteAccount() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ecfdf5 0%, #f8fafc 45%, #fff7ed 100%)",
        padding: "48px 20px",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
      }}
    >
      <section
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 32,
          padding: "40px",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "#dcfce7",
            color: "#166534",
            padding: "10px 14px",
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          🌱 Naija Meal Planner
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 6vw, 56px)",
            lineHeight: 1.05,
            margin: "0 0 16px",
            letterSpacing: "-0.04em",
            color: "#0f172a",
          }}
        >
          Delete Your Account
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.7,
            color: "#475569",
            maxWidth: 700,
            marginBottom: 28,
          }}
        >
          You can delete your Naija Meal Planner account directly inside the
          mobile app. This page explains the steps and what data is removed.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginTop: 28,
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 22 }}>How to delete</h2>

            <ol
              style={{
                paddingLeft: 22,
                color: "#334155",
                lineHeight: 1.9,
                fontSize: 16,
              }}
            >
              <li>Open Naija Meal Planner.</li>
              <li>Go to More.</li>
              <li>Open Settings.</li>
              <li>Tap Delete Account.</li>
              <li>Confirm account deletion.</li>
            </ol>
          </div>

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Need help?</h2>

            <p style={{ color: "#334155", lineHeight: 1.7, fontSize: 16 }}>
              If you cannot access the app, you can request account deletion by
              emailing our support team.
            </p>

            <a
              href="mailto:support@naijamealplanner.com"
              style={{
                display: "inline-block",
                marginTop: 8,
                background: "#15803d",
                color: "white",
                textDecoration: "none",
                padding: "13px 18px",
                borderRadius: 14,
                fontWeight: 900,
              }}
            >
              Email Support
            </a>
          </div>
        </div>

        <div
          style={{
            marginTop: 26,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Data removed</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {[
              "User profile information",
              "Meal plans",
              "Grocery data",
              "Health tracking data",
              "Community posts and comments",
              "Marketplace listings",
              "Saved items and preferences",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "#f8fafc",
                  borderRadius: 14,
                  padding: "12px 14px",
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                ✓ {item}
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 20,
              color: "#64748b",
              lineHeight: 1.7,
              fontSize: 15,
            }}
          >
            When an account is deleted, associated user data is removed from our
            systems. Limited records may be retained only when required by law,
            security investigations, fraud prevention, or regulatory compliance.
          </p>
        </div>

        <footer
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid #e2e8f0",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          © {new Date().getFullYear()} Naija Meal Planner. All rights reserved.
        </footer>
      </section>
    </main>
  );
}