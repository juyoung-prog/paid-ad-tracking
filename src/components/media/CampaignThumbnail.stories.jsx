import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CampaignThumbnail } from './CampaignThumbnail';
import { placeholderSvg } from '../../common/ui/Placeholder';
import { PLATFORM } from '../../data/schema';

export default {
  title: 'Paid Ads Dashboard/Media/CampaignThumbnail',
  component: CampaignThumbnail,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## CampaignThumbnail

캠페인 소재 미리보기 썸네일. thumbnailUrl이 있으면 실제 이미지를 보여주고,
없거나(신규 캠페인) 이미지 로드에 실패하면(끊긴 링크) 플랫폼색 배경 +
캠페인명 이니셜로 자동 대체한다 — 광고 목록에서 캠페인은 항상 뭔가 시각적으로
보여야 하므로 대체 표시는 선택 사항이 아니라 항상 보장되는 fallback이다.
        `,
      },
    },
  },
  argTypes: {
    thumbnailUrl: { control: 'text', description: '소재 미리보기 이미지 URL (없으면 이니셜 대체)' },
    name: { control: 'text', description: '캠페인명 (이니셜/alt 텍스트 생성에 사용)' },
    platform: {
      control: 'select',
      options: [PLATFORM.META, PLATFORM.TIKTOK],
      description: '대체 표시 배경색 결정',
    },
    size: { control: { type: 'number', min: 24, max: 96 }, description: '세로 길이(px) — 9:16 세로 비율, 가로폭은 자동 계산' },
  },
};

export const Default = {
  args: {
    thumbnailUrl: placeholderSvg(120, 120),
    name: 'Summer Sale Traffic',
    platform: PLATFORM.META,
    size: 40,
  },
};

/** thumbnailUrl이 없는 캠페인 — 플랫폼별 배경색 + 이니셜로 대체 표시된다 */
export const NoThumbnail = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <CampaignThumbnail name="Georgia Traffic Push A" platform={PLATFORM.META} />
      <CampaignThumbnail name="TikTok Brand Awareness" platform={PLATFORM.TIKTOK} />
    </Stack>
  ),
};

/** 끊긴 URL — 로드 실패 시에도 이니셜 대체로 자연스럽게 전환된다(깨진 이미지 아이콘 노출 없음) */
export const BrokenUrl = {
  args: {
    thumbnailUrl: 'https://example.invalid/not-a-real-image.jpg',
    name: 'Holiday Conversion FL',
    platform: PLATFORM.META,
    size: 40,
  },
};

/** 크기 비교 — 리스트 행(40px)과 Drawer 상세(64px)에서 쓰는 크기 */
export const Sizes = {
  render: () => (
    <Stack direction="row" spacing={3} alignItems="flex-end">
      {[32, 40, 64].map((size) => (
        <Stack key={size} spacing={1} alignItems="center">
          <CampaignThumbnail name="Ending Soon Campaign" platform={PLATFORM.META} size={size} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {size}px
          </Typography>
        </Stack>
      ))}
    </Stack>
  ),
};
