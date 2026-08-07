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
없거나(신규 캠페인) 이미지 로드에 실패하면(끊긴 링크) 중립 배경 +
캠페인명 이니셜로 자동 대체한다 — 광고 목록에서 캠페인은 항상 뭔가 시각적으로
보여야 하므로 대체 표시는 선택 사항이 아니라 항상 보장되는 fallback이다.

대체 표시는 한때 플랫폼 원색(Meta=primary #0000FF, TikTok=secondary)으로 채웠는데
중립 톤으로 바꿨다. 이미지가 없을 때 뜨는 자리표시자에 채도 100% 파랑이 깔리면
목록에서 가장 강한 요소가 되고("컨트롤이 목록보다 강하면 안 된다"는 테마 원칙은
자리표시자에도 적용된다), 플랫폼은 바로 옆 Platform 컬럼이 글자로 이미 말한다.
platform prop은 색이 아니라 접근성 이름에 쓴다 — 스크린리더는 옆 컬럼을 함께
읽어주지 않는다.

프레임은 정사각형이다. 한때 9:16 세로형이었는데("소재는 대부분 Reels/Stories"라는
추정), 동기화가 실제로 가져오는 Meta 소재 썸네일이 정사각형(320x320)이라 세로
프레임에서 좌우가 44% 잘렸다. 게다가 높이 40일 때 폭이 22px라 "소재를 알아본다"는
목적 자체가 성립하지 않았다(실사용 신고). 소스 형식에 맞춰 정사각형으로 되돌렸다.
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
      description: '대체 표시의 접근성 이름에 포함 (색상에는 영향 없음)',
    },
    size: { control: { type: 'number', min: 24, max: 96 }, description: '한 변의 길이(px) — 정사각형' },
  },
};

export const Default = {
  args: {
    thumbnailUrl: placeholderSvg(120, 120),
    name: 'Summer Sale Traffic',
    platform: PLATFORM.META,
  },
};

/** thumbnailUrl이 없는 캠페인 — 중립 배경 + 이니셜로 대체 표시된다(플랫폼과 무관하게 동일) */
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
  },
};

/** 크기 비교 — 리스트 행(48px, 기본값)과 Drawer 헤더·폼 미리보기(56px)에서 쓰는 크기 */
export const Sizes = {
  render: () => (
    <Stack direction="row" spacing={3} alignItems="flex-end">
      {[32, 48, 56].map((size) => (
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
