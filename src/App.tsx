import { AppProvider, useApp } from "./state/appContext";
import { Header } from "./shell/Header";
import { GlobeContainer } from "./globe/GlobeContainer";
import { CountryView } from "./country/CountryView";
import { Timeline } from "./timeline/Timeline";
import { RecordPanel } from "./record/RecordPanel";
import { LocationClusterPicker } from "./record/LocationClusterPicker";
import { AboutModal } from "./shell/AboutModal";
import { SubmitModal } from "./shell/SubmitModal";
import { IndexDrawer } from "./shell/IndexDrawer";

function MainLayout() {
  const {
    viewMode,
    isTimelineCollapsed,
    selectedCountry,
    countryMeta,
    visibleRecords,
    selectedRecord,
    closeRecord,
    openRecord,
    returnToGlobe,
    selectedCluster,
    selectCluster,
    aboutOpen,
    setAboutOpen,
    submitOpen,
    setSubmitOpen,
    indexOpen,
    setIndexOpen,
  } = useApp();

  return (
    <div className={`seam-app-layout ${selectedRecord ? "has-record" : ""} ${isTimelineCollapsed ? "timeline-collapsed" : ""}`}>
      <Header />

      <main className="seam-main-viewport">
        {viewMode === "globe" ? (
          <GlobeContainer />
        ) : (
          selectedCountry && (
            <CountryView
              country={selectedCountry}
              meta={countryMeta}
              records={visibleRecords}
              onBack={() => returnToGlobe()}
              onRecordClick={openRecord}
              onClusterClick={selectCluster}
            />
          )
        )}
      </main>

      <Timeline />

      <RecordPanel record={selectedRecord} onClose={closeRecord} />

      {selectedCluster && (
        <LocationClusterPicker
          cluster={selectedCluster}
          onSelectRecord={(rec) => {
            openRecord(rec);
            selectCluster(null);
          }}
          onClose={() => selectCluster(null)}
        />
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {submitOpen && <SubmitModal onClose={() => setSubmitOpen(false)} />}
      {indexOpen && <IndexDrawer onClose={() => setIndexOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
