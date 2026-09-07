import Box from '@mui/material/Box';
import { expect, fn } from 'storybook/test';
import SaasWorkflowView from './SaasWorkflowView';
import { SAAS_FONT } from './SaasShell';
import { ALL_STORES } from '../../../data/beautymaster/schema.js';

const STORES = ['G02', 'G09', 'G10'];

/** Links 시트 탭에서 오는 store별 문서 링크 (parseStoreDocsCsv 결과 형태) */
const STORE_DOCS = {
  G10: {
    tier1ConsentFormUrl: 'https://forms.gle/EXAMPLE-T1',
    tier2ConsentFormUrl: 'https://forms.gle/EXAMPLE-T2',
    tier1InfluencerListUrl: 'https://docs.google.com/spreadsheets/d/EXAMPLE-T1/edit',
    // tier2InfluencerListUrl은 일부러 비워 "Not set for {store}" 안내를 보여준다
  },
};

export default {
  title: 'BeautyMaster/Section/SaasWorkflowView',
  component: SaasWorkflowView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    defaultExpanded: {
      control: 'select',
      options: ['01', '02', '03', '04', '05', '06', '07'],
      description: '최초 펼친 단계 번호',
    },
    stores: { control: 'object', description: '스토어 선택 옵션' },
    selectedStore: { control: 'select', options: [ALL_STORES, ...STORES], description: '선택된 스토어 — 세 뷰가 공유' },
    storeDocs: { control: 'object', description: 'store별 문서 링크 맵 (Links 시트 탭)' },
    influencerTrackingListUrl: { control: 'text', description: '스토어 무관 고정 링크' },
    onStoreChange: { action: 'storeChanged', description: '스토어 변경 핸들러' },
  },
  args: {
    stores: STORES,
    selectedStore: ALL_STORES,
    onStoreChange: fn(),
  },
  decorators: [
    Story => (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: SAAS_FONT }}>
        <Story />
      </Box>
    ),
  ],
};

/** 기본 — 스토어 미선택. Files & systems는 "Select a store" 안내로 대체된다 */
export const Default = {};

/**
 * 스토어 선택 — 해당 매장의 동의서·목록 링크가 실제로 걸린다.
 * G10은 Tier 2 목록 링크를 비워둬 "Not set for G10" 안내도 함께 보여준다.
 */
export const StoreSelected = {
  args: {
    selectedStore: 'G10',
    storeDocs: STORE_DOCS,
    influencerTrackingListUrl: 'https://docs.google.com/spreadsheets/d/EXAMPLE/edit',
  },
};

/** 다른 단계를 펼친 상태 */
export const StepExpanded = {
  args: { defaultExpanded: '04' },
};

/**
 * 문서 전체가 한 단(段)을 공유한다.
 *
 * 산문 위주라 폭을 묶어 한 줄 길이를 유지하되, 좌측 정렬로 두면 넓은 화면에서
 * 오른쪽만 비어 보여 가운데로 모았다. 이때 아코디언만 가운데 정렬했더니 제목은
 * x=80, 카드는 x=308이 되어 기준선이 갈라졌다. 제목·통계·아코디언이 같은 컨테이너
 * 안에 있어야 한다.
 */
export const DocumentSharesOneColumn = {
  play: async ({ canvasElement }) => {
    const leaf = text => [...canvasElement.querySelectorAll('*')]
      .find(e => !e.children.length && e.textContent.trim() === text);

    const title = leaf('Influencer workflow');
    const accordion = canvasElement.querySelector('.MuiAccordion-root');
    await expect(title).toBeTruthy();
    await expect(accordion).toBeTruthy();

    const titleX = Math.round(title.getBoundingClientRect().x);
    const accordionX = Math.round(accordion.getBoundingClientRect().x);
    await expect(titleX).toBe(accordionX);

    // 폭은 묶여 있어야 한다 — 넓은 화면에서 산문이 한 줄로 늘어지면 읽기 나빠진다
    const width = accordion.getBoundingClientRect().width;
    await expect(width).toBeLessThanOrEqual(880);
  },
};
