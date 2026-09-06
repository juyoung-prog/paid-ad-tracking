import { ImageCard } from './ImageCard';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Placeholder, { placeholderSvg } from '../../common/ui/Placeholder';

export default {
  title: 'Component/3. Card/ImageCard',
  component: ImageCard,
  tags: ['autodocs'],
};

export const Default = {
  render: () => (
    <Box sx={ { maxWidth: 400, p: 2 } }>
      <ImageCard
        src={ placeholderSvg(600, 400) }
        title="Neon City Vibes"
        tags={ ['Neon', 'City', 'Night'] }
        onLike={ () => console.log('Liked!') }
      />
    </Box>
  ),
};

export const MasonryGrid = {
  render: () => (
    <Box sx={ { maxWidth: 1000, p: 2 } }>
      <Grid container spacing={ 3 }>
        <Grid size={ { xs: 12, sm: 6, md: 4 } }>
          <ImageCard
            src={ placeholderSvg(600, 400) }
            title="Neon City"
            tags={ ['Cyberpunk'] }
          />
        </Grid>
        <Grid size={ { xs: 12, sm: 6, md: 4 } }>
          <ImageCard
            src={ placeholderSvg(600, 400) }
            title="Product Shot"
            tags={ ['Minimal'] }
          />
        </Grid>
        <Grid size={ { xs: 12, sm: 6, md: 4 } }>
          <ImageCard
            src={ placeholderSvg(600, 400) }
            title="Abstract"
            tags={ ['Art'] }
          />
        </Grid>
      </Grid>
    </Box>
  ),
};
