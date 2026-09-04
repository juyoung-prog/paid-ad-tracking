import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {
	DocumentTitle,
	PageContainer,
	SectionTitle,
} from "../../components/storybookDocumentation";

/** Style class name mapping */
const STYLE_CLASS_MAP = {
	outlined: "material-symbols-outlined",
	rounded: "material-symbols-rounded",
	sharp: "material-symbols-sharp",
};

/**
 * MaterialSymbol Component
 *
 * Props:
 * @param {string} name - Icon name from Material Symbols [Required]
 * @param {string} variant - Icon style ('outlined' | 'rounded' | 'sharp') [Optional, default: 'outlined']
 * @param {number} size - Icon size in px [Optional, default: 24]
 * @param {boolean} fill - Fill state (Fill axis) [Optional, default: false]
 * @param {number} weight - Stroke weight (Weight axis) [Optional, default: 400]
 * @param {string} color - Icon color [Optional, default: 'inherit']
 *
 * Example usage:
 * <MaterialSymbol name="favorite" variant="rounded" size={ 32 } fill />
 */
const MaterialSymbol = ({
	name,
	variant = "outlined",
	size = 24,
	fill = false,
	weight = 400,
	color = "inherit",
}) => (
	<span
		className={STYLE_CLASS_MAP[variant] || STYLE_CLASS_MAP.outlined}
		style={{
			fontSize: size,
			color,
			fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}`,
			lineHeight: 1,
			display: "inline-block",
			verticalAlign: "middle",
		}}
	>
		{name}
	</span>
);

export default {
	title: "Style/Icons",
	component: MaterialSymbol,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `
## Material Symbols

Google Material Symbols is a Variable Font based icon system with 2,500+ icons.

### Structure
- Style: Outlined, Rounded, Sharp
- Variable Font Axes: Fill, Weight, Grade, Optical Size

### Usage
Use the Controls panel to change icon properties in real-time.
        `,
			},
		},
	},
	argTypes: {
		name: {
			control: "text",
			description: "Icon name (Material Symbols name)",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: "favorite" },
			},
		},
		variant: {
			control: "select",
			options: ["outlined", "rounded", "sharp"],
			description: "Icon style",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: "outlined" },
			},
		},
		size: {
			control: { type: "range", min: 16, max: 96, step: 4 },
			description: "Icon size (px)",
			table: {
				type: { summary: "number" },
				defaultValue: { summary: 24 },
			},
		},
		fill: {
			control: "boolean",
			description: "Fill state (Fill axis)",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: false },
			},
		},
		weight: {
			control: { type: "range", min: 100, max: 700, step: 100 },
			description: "Stroke weight (Weight axis)",
			table: {
				type: { summary: "number" },
				defaultValue: { summary: 400 },
			},
		},
		color: {
			control: "color",
			description: "Icon color",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: "inherit" },
			},
		},
	},
};

/** Default - Interactive Controls */
export const Default = {
	args: {
		name: "favorite",
		variant: "outlined",
		size: 48,
		fill: false,
		weight: 400,
		color: "#0000FF",
	},
};

/** Fill Usage - Toggle state pattern */
export const FillUsage = {
	parameters: {
		layout: "padded",
	},
	render: () => <FillUsageDocs />,
};

/* useTheme는 훅이라 render 화살표 함수 안에서 직접 부르면 rules-of-hooks에
   걸린다(Shape.stories와 같은 패턴으로 분리). 활성 색은 머티리얼 기본
   팔레트(#e91e63, #1976d2 등)가 아니라 이 테마의 토큰에서 가져온다 —
   스토리북이 대시보드에 없는 색을 보여주면 안 된다. */
function FillUsageDocs() {
	const theme = useTheme();
	const fillExamples = [
		{ icon: "favorite", label: "Like", activeColor: theme.palette.error.main },
		{ icon: "bookmark", label: "Bookmark", activeColor: theme.palette.accent.main },
		{ icon: "star", label: "Favorite", activeColor: theme.palette.warning.main },
		{ icon: "thumb_up", label: "Recommend", activeColor: theme.palette.primary.main },
		{ icon: "check_circle", label: "Complete", activeColor: theme.palette.success.main },
		{ icon: "visibility", label: "Visible", activeColor: theme.palette.secondary.main },
	];

		return (
			<>
				<DocumentTitle
					title="Icon Fill Usage"
					status="Available"
					note="Fill property usage patterns"
					brandName="Design System"
					systemName="Starter Kit"
					version="1.0"
				/>
				<PageContainer>
					<Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
						Fill Usage
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
						Express toggle states using the Fill property.
					</Typography>

					<SectionTitle
						title="Toggle Pattern"
						description="Selected/Unselected state expression"
					/>

					<TableContainer sx={{ mb: 4 }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 600, width: "20%" }}>
										Icon
									</TableCell>
									<TableCell sx={{ fontWeight: 600, width: "20%" }}>
										Usage
									</TableCell>
									<TableCell sx={{ fontWeight: 600, width: "30%" }}>
										Off (Fill: 0)
									</TableCell>
									<TableCell sx={{ fontWeight: 600 }}>On (Fill: 1)</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{fillExamples.map((item) => (
									<TableRow key={item.icon}>
										<TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
											{item.icon}
										</TableCell>
										<TableCell>{item.label}</TableCell>
										<TableCell>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<MaterialSymbol
													name={item.icon}
													size={28}
													fill={false}
												/>
												<Typography variant="caption" color="text.secondary">
													Unselected
												</Typography>
											</Box>
										</TableCell>
										<TableCell>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<MaterialSymbol
													name={item.icon}
													size={28}
													fill
													color={item.activeColor}
												/>
												<Typography variant="caption" color="text.secondary">
													Selected
												</Typography>
											</Box>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>

					<SectionTitle title="Code Example" />

					<Box
						component="pre"
						sx={{
							backgroundColor: "grey.100",
							p: 3,
							fontSize: 12,
							fontFamily: "monospace",
							overflow: "auto",
						}}
					>
						{`// React state toggle
const [isLiked, setIsLiked] = useState(false);

<span
  className="material-symbols-outlined"
  style={{
    fontVariationSettings: \`'FILL' \${isLiked ? 1 : 0}\`,
    // 활성 색은 하드코딩하지 않고 테마 토큰을 쓴다 (예: error.main = ${theme.palette.error.main})
    color: isLiked ? theme.palette.error.main : 'inherit',
    cursor: 'pointer'
  }}
  onClick={() => setIsLiked(!isLiked)}
>
  favorite
</span>`}
					</Box>
				</PageContainer>
			</>
	);
}
