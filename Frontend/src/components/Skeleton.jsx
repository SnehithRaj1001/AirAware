import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height, borderRadius, style = {}, className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '8px',
        ...style,
      }}
    />
  );
};

export const DashboardSkeleton = () => (
  <main className="page-shell">
    <div className="skeleton-hero">
      <Skeleton width="260px" height="38px" style={{ marginBottom: '12px' }} />
      <Skeleton width="420px" height="20px" />
    </div>

    <div className="skeleton-controls-row">
      <Skeleton height="56px" borderRadius="12px" style={{ flex: 1 }} />
      <Skeleton height="56px" borderRadius="12px" style={{ flex: 1 }} />
      <Skeleton height="56px" borderRadius="12px" style={{ flex: 1 }} />
    </div>

    <div className="skeleton-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton width="60%" height="22px" style={{ marginBottom: '14px' }} />
          <Skeleton width="40%" height="16px" style={{ marginBottom: '20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <Skeleton height="70px" borderRadius="10px" />
            <Skeleton height="70px" borderRadius="10px" />
          </div>
          <Skeleton width="30%" height="16px" />
        </div>
      ))}
    </div>
  </main>
);

export const UserDashboardSkeleton = () => (
  <main className="page-shell">
    <div className="skeleton-hero">
      <Skeleton width="320px" height="36px" style={{ marginBottom: '10px' }} />
      <Skeleton width="220px" height="20px" />
    </div>

    {/* Big AQI Main Card Skeleton */}
    <div className="skeleton-main-aqi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ width: '50%' }}>
          <Skeleton width="120px" height="24px" borderRadius="999px" style={{ marginBottom: '12px' }} />
          <Skeleton width="80%" height="32px" />
        </div>
        <Skeleton width="100px" height="36px" borderRadius="999px" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="90px" borderRadius="12px" />
        ))}
      </div>
    </div>

    {/* 2-Column bottom grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '32px' }}>
      <div>
        <Skeleton width="180px" height="26px" style={{ marginBottom: '20px' }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="85px" borderRadius="12px" style={{ marginBottom: '16px' }} />
        ))}
      </div>
      <div>
        <Skeleton width="180px" height="26px" style={{ marginBottom: '20px' }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="75px" borderRadius="12px" style={{ marginBottom: '16px' }} />
        ))}
      </div>
    </div>
  </main>
);

export const MapSkeleton = () => (
  <main className="page-shell">
    <div className="skeleton-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Skeleton width="280px" height="36px" style={{ marginBottom: '10px' }} />
        <Skeleton width="380px" height="20px" />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Skeleton width="140px" height="38px" borderRadius="999px" />
        <Skeleton width="120px" height="38px" borderRadius="999px" />
      </div>
    </div>
    <Skeleton height="620px" borderRadius="16px" style={{ marginTop: '24px' }} />
  </main>
);

export const StationDetailsSkeleton = () => (
  <main className="page-shell">
    <div className="skeleton-hero">
      <Skeleton width="340px" height="38px" style={{ marginBottom: '10px' }} />
      <Skeleton width="240px" height="20px" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '24px' }}>
      <div>
        <Skeleton height="360px" borderRadius="16px" style={{ marginBottom: '24px' }} />
        <Skeleton height="280px" borderRadius="16px" />
      </div>
      <div>
        <Skeleton height="440px" borderRadius="16px" />
      </div>
    </div>
  </main>
);

export const ProfileSkeleton = () => (
  <div className="profile-page-shell">
    <div className="profile-container">
      {/* Profile Header Hero Card Skeleton */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <Skeleton width="72px" height="72px" borderRadius="50%" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton width="220px" height="28px" style={{ marginBottom: "8px" }} />
          <Skeleton width="120px" height="16px" style={{ marginBottom: "14px" }} />
          <div style={{ display: "flex", gap: "10px" }}>
            <Skeleton width="130px" height="26px" borderRadius="20px" />
            <Skeleton width="160px" height="26px" borderRadius="20px" />
          </div>
        </div>
      </div>

      {/* Account Details Card Skeleton */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div>
          <Skeleton width="180px" height="22px" style={{ marginBottom: "6px" }} />
          <Skeleton width="280px" height="14px" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <Skeleton width="90px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
          <div>
            <Skeleton width="90px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <Skeleton width="80px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
          <div>
            <Skeleton width="110px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
        </div>

        <div>
          <Skeleton width="180px" height="14px" style={{ marginBottom: "8px" }} />
          <Skeleton height="46px" borderRadius="10px" />
        </div>
      </div>

      {/* Health & Personalization Card Skeleton */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div>
          <Skeleton width="240px" height="22px" style={{ marginBottom: "6px" }} />
          <Skeleton width="340px" height="14px" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <Skeleton width="60px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
          <div>
            <Skeleton width="70px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
        </div>

        {/* Condition Chips */}
        <div>
          <Skeleton width="200px" height="14px" style={{ marginBottom: "12px" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <Skeleton width="90px" height="36px" borderRadius="20px" />
            <Skeleton width="80px" height="36px" borderRadius="20px" />
            <Skeleton width="120px" height="36px" borderRadius="20px" />
            <Skeleton width="95px" height="36px" borderRadius="20px" />
            <Skeleton width="85px" height="36px" borderRadius="20px" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <Skeleton width="120px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
          <div>
            <Skeleton width="160px" height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton height="46px" borderRadius="10px" />
          </div>
        </div>

        <div>
          <Skeleton width="140px" height="14px" style={{ marginBottom: "8px" }} />
          <Skeleton height="46px" borderRadius="10px" />
        </div>

        <div>
          <Skeleton width="190px" height="14px" style={{ marginBottom: "8px" }} />
          <Skeleton height="86px" borderRadius="10px" />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <Skeleton width="150px" height="46px" borderRadius="12px" />
        </div>
      </div>
    </div>
  </div>
);
