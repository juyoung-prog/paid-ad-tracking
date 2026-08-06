import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import SaasDashboard from '../../components/templates/beautymaster/SaasDashboard';
import InfluencerDrawer from '../../components/overlay-feedback/InfluencerDrawer';
import SheetSettingsModal from '../../components/overlay-feedback/SheetSettingsModal';
import SheetSetupScreen from '../../components/templates/beautymaster/SheetSetupScreen';
import { useSheetData } from '../../hooks/useSheetData.js';
import { ALL_STORES, deriveStores } from '../../data/beautymaster/schema.js';
import { findSheetViewUrl } from '../../utils/googleSheetUrl.js';

// ─── Mock data (Storybook / ComponentGallery only) ────────────────────────────

const D = iso => new Date(iso);

export const MOCK_INFLUENCERS = [
  {
    id: 'Processing_0', sheetStatus: 'Processing', fullName: 'Kim Minjung', store: 'G10', month: 7,
    barcode: 'G10INF2026', tier: 'tier1', platform: 'Instagram', category: 'kbeauty',
    creditType: '$100 Credit', imageUrl: '', socialAccountUrl: 'https://instagram.com/kim.minjung',
    email: 'kim.minjung@gmail.com', scheduledTime: D('2026-07-05T10:30:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'today', alertFlags: ['attend-no-collabo'],
    agreement: true, attend: true, collaboShared: false, creditShared: false, creditUsed: false,
    collaboLink: '', uploadDate: null, serialNumber: '', opinion: null,
    views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
    note: 'Visit complete. Content upload expected.',
  },
  {
    id: 'Processing_1', sheetStatus: 'Processing', fullName: 'Park Soyeon', store: 'G10', month: 7,
    barcode: 'G10INF2026', tier: 'tier1', platform: 'TikTok', category: 'general',
    creditType: '$100 Credit', imageUrl: '', socialAccountUrl: 'https://tiktok.com/@park.soyeon',
    email: 'park.soyeon@naver.com', scheduledTime: D('2026-07-05T14:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'today', alertFlags: [],
    agreement: true, attend: true, collaboShared: true, creditShared: true, creditUsed: true,
    collaboLink: 'https://tiktok.com/@example/video/1', uploadDate: D('2026-07-05'),
    serialNumber: 'G10CRED000101', opinion: 'USE', recordDate: D('2026-07-19'),
    views: 24300, likes: 5820, shares: 312, saves: 1430, comments: 567, reposts: 89,
    note: '',
  },
  {
    id: 'Processing_2', sheetStatus: 'Processing', fullName: 'Lee Jiyeon', store: 'G10', month: 7,
    barcode: 'G10INF202620', tier: 'tier2', platform: 'Instagram', category: 'specific',
    creditType: '$20 Credit_Tier2', imageUrl: '', socialAccountUrl: 'https://instagram.com/lee.jiyeon',
    email: 'lee.jiyeon@kakao.com', scheduledTime: D('2026-07-08T11:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'this-week', alertFlags: [],
    agreement: true, attend: false, collaboShared: false, creditShared: false, creditUsed: false,
    collaboLink: '', uploadDate: null, serialNumber: '', opinion: null,
    views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
    note: '',
  },
  {
    id: 'Processing_3', sheetStatus: 'Processing', fullName: 'Han Areum', store: 'G10', month: 7,
    barcode: 'G10INF202620', tier: 'tier2', platform: 'TikTok', category: 'general',
    creditType: '$20 Credit_Tier2', imageUrl: '', socialAccountUrl: '',
    email: '', scheduledTime: D('2026-07-10T14:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'this-week', alertFlags: [],
    agreement: true, attend: false, collaboShared: false, creditShared: false, creditUsed: false,
    collaboLink: '', uploadDate: null, serialNumber: '', opinion: null,
    views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
    note: 'Rescheduled from Jun 28.',
  },
  {
    id: 'Processing_4a', sheetStatus: 'Processing', fullName: 'Yoon Soojin', store: 'G10', month: 7,
    barcode: 'G10INF2026', tier: 'tier1', platform: 'Instagram', category: 'kbeauty',
    creditType: '$100 Credit', imageUrl: '', socialAccountUrl: '',
    email: '', scheduledTime: D('2026-07-12T11:30:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'later', alertFlags: [],
    agreement: true, attend: false, collaboShared: false, creditShared: false, creditUsed: false,
    collaboLink: '', uploadDate: null, serialNumber: '', opinion: null,
    views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
    note: '',
  },
  {
    id: 'Processing_5a', sheetStatus: 'Processing', fullName: 'Choi Yuna', store: 'G10', month: 7,
    barcode: 'G10INF2026', tier: 'tier1', platform: 'Instagram', category: 'kbeauty',
    creditType: '$100 Credit', imageUrl: '', socialAccountUrl: '',
    email: '', scheduledTime: D('2026-07-14T13:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'later', alertFlags: [],
    agreement: true, attend: false, collaboShared: false, creditShared: false, creditUsed: false,
    collaboLink: '', uploadDate: null, serialNumber: '', opinion: null,
    views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
    note: '',
  },
  {
    id: 'Processing_5', sheetStatus: 'Processing', fullName: 'Shin Dahye', store: 'G10', month: 7,
    barcode: 'G10INF2026', tier: 'tier1', platform: 'Instagram', category: 'kbeauty',
    creditType: '$100 Credit', imageUrl: '', socialAccountUrl: '',
    email: '', scheduledTime: D('2026-07-02T13:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'past', alertFlags: ['collabo-no-credit'],
    agreement: true, attend: true, collaboShared: true, creditShared: false, creditUsed: false,
    collaboLink: 'https://instagram.com/p/example3', uploadDate: D('2026-07-03'),
    serialNumber: '', opinion: null,
    views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
    note: '',
  },
  {
    id: 'Done_0', sheetStatus: 'Done', fullName: 'Oh Seulgi', store: 'G10', month: 6,
    barcode: 'G10INF2026', tier: 'tier1', platform: 'Instagram', category: 'kbeauty',
    creditType: '$100 Credit', imageUrl: '', socialAccountUrl: '',
    email: '', scheduledTime: D('2026-06-28T10:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'past', alertFlags: [],
    agreement: true, attend: true, collaboShared: true, creditShared: true, creditUsed: true,
    collaboLink: 'https://instagram.com/p/example2', uploadDate: D('2026-06-29'),
    serialNumber: 'G10CRED000055', opinion: 'MAYBE', recordDate: D('2026-07-13'),
    views: 8900, likes: 1230, shares: 76, saves: 340, comments: 89, reposts: 12,
    note: 'To be reviewed next month.',
  },
  {
    id: 'Done_1', sheetStatus: 'Done', fullName: 'Na Eunji', store: 'G10', month: 6,
    barcode: 'G10INF202620', tier: 'tier2', platform: 'TikTok', category: 'general',
    creditType: '$20 Credit_Tier2', imageUrl: '', socialAccountUrl: '',
    email: '', scheduledTime: D('2026-06-20T14:00:00'), hasScheduledTimeOfDay: true,
    scheduleGroup: 'past', alertFlags: [],
    agreement: true, attend: true, collaboShared: true, creditShared: true, creditUsed: true,
    collaboLink: 'https://tiktok.com/@example2/video/1', uploadDate: D('2026-06-22'),
    serialNumber: 'G10CRED000042', opinion: 'USE', recordDate: D('2026-07-06'),
    views: 31200, likes: 7400, shares: 520, saves: 2100, comments: 830, reposts: 140,
    note: '',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BeautymasterDashboard page component
 *
 * Full-screen influencer management dashboard.
 * Reads data from Google Sheets via useSheetData and hands it to SaasDashboard,
 * which owns only the screen state (active view, selected store).
 * Shows SheetSetupScreen when no config is saved.
 *
 * Props: (none — data is owned internally via useSheetData)
 */
function BeautymasterDashboard() {
  const {
    influencers, inviteCounts, storeDocs, messageTemplates, influencerTrackingListUrl,
    isSyncing, lastSyncedAt, error, refresh, config, saveConfig,
  } = useSheetData();

  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** 스토어는 Operations/Analytics/Workflow가 공유한다 — 뷰를 옮겨도 유지된다 */
  const [selectedStore, setSelectedStore] = useState(config?.defaultStore || ALL_STORES);

  const stores = useMemo(() => deriveStores(influencers), [influencers]);
  const selectedInfluencer = influencers.find(i => i.id === selectedId) || null;
  const sheetUrl = findSheetViewUrl(config);

  const handleSelect = inf => {
    setSelectedId(inf.id);
    setDrawerOpen(true);
  };

  const handleSaveConfig = newConfig => {
    saveConfig(newConfig);
    if (newConfig.defaultStore) setSelectedStore(newConfig.defaultStore);
    setSettingsOpen(false);
  };

  const settingsModal = (
    <SheetSettingsModal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      config={config}
      onSave={handleSaveConfig}
      stores={stores}
    />
  );

  // ── Setup screen (no config saved yet) ──────────────────────────────────────
  if (!config) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SheetSetupScreen onSetup={() => setSettingsOpen(true)} />
        {settingsModal}
      </Box>
    );
  }

  // ── Dashboard (config saved, data polling active) ───────────────────────────
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <SaasDashboard
        influencers={influencers}
        inviteCounts={inviteCounts}
        lastSyncedAt={lastSyncedAt}
        onSelect={handleSelect}
        selectedId={selectedId}
        onRefresh={refresh}
        onOpenSettings={() => setSettingsOpen(true)}
        sheetUrl={sheetUrl}
        isLoading={isSyncing}
        isSyncing={isSyncing}
        error={error}
        onRetry={refresh}
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        storeDocs={storeDocs}
        influencerTrackingListUrl={influencerTrackingListUrl}
      />
      <InfluencerDrawer
        influencer={selectedInfluencer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        templates={messageTemplates}
        sheetUrl={sheetUrl}
      />
      {settingsModal}
    </Box>
  );
}

export default BeautymasterDashboard;
