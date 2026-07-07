/**
 * generate-rules.js
 *
 * .claude/rules/ 와 .claude/skills/ (Claude), 그리고
 * .agents/skills/ 와 .codex/agents/ (Codex) 를 스캔하여
 * src/data/ruleRelationships.js 를 자동 생성한다.
 *
 * 사용: pnpm generate-rules
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { join, basename, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const RULES_DIR = join(ROOT, '.claude', 'rules');
const SKILLS_DIR = join(ROOT, '.claude', 'skills');
const AGENTS_SKILLS_DIR = join(ROOT, '.agents', 'skills');
const CODEX_AGENTS_DIR = join(ROOT, '.codex', 'agents');
const OUT = join(ROOT, 'src', 'data', 'ruleRelationships.js');

/** 첫 번째 heading에서 우선순위 키워드를 추출한다 */
function parsePriority(content) {
  const first = content.split('\n').find((l) => l.startsWith('#'));
  if (!first) return 'MUST';
  if (first.includes('CRITICAL')) return 'CRITICAL';
  if (first.includes('SHOULD')) return 'SHOULD';
  return 'MUST';
}

/** 파일명을 kebab-case id로 변환한다 */
function toId(filename) {
  return basename(filename, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** SKILL.md frontmatter에서 description 첫 문장을 추출한다 */
function parseSkillDescription(content) {
  const match = content.match(/^---\n[\s\S]*?description:\s*(.+)\n[\s\S]*?---/);
  if (match) return match[1].trim();
  const line = content.split('\n').find((l) => l.startsWith('>'));
  return line ? line.replace(/^>\s*/, '') : '';
}

/** Codex 서브에이전트 TOML에서 description 값을 추출한다 */
function parseTomlDescription(content) {
  const m = content.match(/^description\s*=\s*"((?:[^"\\]|\\.)*)"/m);
  return m ? m[1].trim() : '';
}

// ── 노드 수집 ──

const nodes = [];
const edges = [];

// Root
nodes.push({
  id: 'claude-md',
  name: 'CLAUDE.md',
  priority: 'root',
  path: 'CLAUDE.md',
  description: '프로젝트 규칙 진입점 (라우터 역할)',
});

// Rules
if (existsSync(RULES_DIR)) {
  for (const file of readdirSync(RULES_DIR).filter((f) => f.endsWith('.md')).sort()) {
    const content = readFileSync(join(RULES_DIR, file), 'utf-8');
    const id = toId(file);
    nodes.push({
      id,
      name: file,
      priority: parsePriority(content),
      path: `.claude/rules/${file}`,
      description: content.split('\n').find((l) => l && !l.startsWith('#'))?.trim() || '',
    });
    edges.push({ from: 'claude-md', to: id, type: 'loads' });
  }
}

// Skills + Resources
if (existsSync(SKILLS_DIR)) {
  for (const dir of readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const skillPath = join(SKILLS_DIR, dir.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const skillContent = readFileSync(skillPath, 'utf-8');
    const skillId = dir.name;

    nodes.push({
      id: skillId,
      name: `${dir.name} (Skill)`,
      priority: 'Skill',
      path: `.claude/skills/${dir.name}/SKILL.md`,
      description: parseSkillDescription(skillContent),
    });
    edges.push({ from: 'claude-md', to: skillId, type: 'activates', note: '' });

    // Resources
    const resDir = join(SKILLS_DIR, dir.name, 'resources');
    if (existsSync(resDir)) {
      for (const resFile of readdirSync(resDir).filter((f) => f.endsWith('.md')).sort()) {
        const resId = `${skillId}--${toId(resFile)}`;
        const resContent = readFileSync(join(resDir, resFile), 'utf-8');
        nodes.push({
          id: resId,
          name: resFile,
          priority: 'Skill Resource',
          path: `.claude/skills/${dir.name}/resources/${resFile}`,
          description: resContent.split('\n').find((l) => l && !l.startsWith('#'))?.trim() || '',
        });
        edges.push({ from: skillId, to: resId, type: 'resources', note: '' });
      }
    }
  }
}

// ── Codex 자산 (.agents/skills, .codex/agents) ──
// Codex 스킬은 얇은 어댑터로 .claude 원본을 canonical SSOT 로 참조한다.

if (existsSync(AGENTS_SKILLS_DIR) || existsSync(CODEX_AGENTS_DIR)) {
  nodes.push({
    id: 'agents-md',
    name: 'AGENTS.md',
    priority: 'root',
    path: 'AGENTS.md',
    description: 'Codex 규칙 진입점 (.agents/skills · .codex/agents 라우터)',
  });
}

// Codex Skills (.agents/skills/*)
if (existsSync(AGENTS_SKILLS_DIR)) {
  for (const dir of readdirSync(AGENTS_SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const skillPath = join(AGENTS_SKILLS_DIR, dir.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const skillContent = readFileSync(skillPath, 'utf-8');
    const skillId = `codex-skill--${dir.name}`;

    nodes.push({
      id: skillId,
      name: `${dir.name} (Codex Skill)`,
      priority: 'Codex Skill',
      path: `.agents/skills/${dir.name}/SKILL.md`,
      description: parseSkillDescription(skillContent),
    });
    edges.push({ from: 'agents-md', to: skillId, type: 'activates', note: '' });

    // canonical SSOT 링크: vdl-<name> → <name> (Claude 원본 스킬)
    const canonical = dir.name.replace(/^vdl-/, '');
    if (nodes.some((n) => n.id === canonical)) {
      edges.push({ from: skillId, to: canonical, type: 'references', note: 'canonical SSOT' });
    }
  }
}

// Codex Subagents (.codex/agents/*.toml)
if (existsSync(CODEX_AGENTS_DIR)) {
  for (const file of readdirSync(CODEX_AGENTS_DIR).filter((f) => f.endsWith('.toml')).sort()) {
    const content = readFileSync(join(CODEX_AGENTS_DIR, file), 'utf-8');
    const id = `codex-agent--${basename(file, '.toml').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    nodes.push({
      id,
      name: basename(file),
      priority: 'Codex Agent',
      path: `.codex/agents/${file}`,
      description: parseTomlDescription(content),
    });
    edges.push({ from: 'agents-md', to: id, type: 'activates', note: '' });
  }
}

// ── conditionMatrix ──
// 의미적 매핑이므로 자동 생성 불가. 노드 id 기반으로 정적 정의.
const ruleIds = nodes.filter((n) => ['CRITICAL', 'MUST', 'SHOULD'].includes(n.priority)).map((n) => n.id);
const skillIds = nodes.filter((n) => n.priority === 'Skill').map((n) => n.id);

const conditionMatrix = [
  {
    task: '컴포넌트 생성',
    rules: ruleIds.filter((id) => ['design-system', 'code-convention'].includes(id)),
    skill: 'component-work',
    skillResources: ['component-work--taxonomy-index', 'component-work--storybook-writing'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: '컴포넌트 수정',
    rules: ruleIds.filter((id) => ['design-system', 'code-convention'].includes(id)),
    skill: 'component-work',
    skillResources: ['component-work--storybook-writing'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: '컴포넌트 삭제',
    rules: [],
    skill: 'component-work',
  },
  {
    task: '인터랙티브 컴포넌트',
    rules: ruleIds.filter((id) => ['design-system', 'code-convention'].includes(id)),
    skill: 'component-work',
    skillResources: ['component-work--taxonomy-index', 'component-work--interactive-principles', 'component-work--storybook-writing'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: '스토리 작성/수정',
    rules: [],
    skill: 'component-work',
    skillResources: ['component-work--storybook-writing'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: '외부 코드 변환',
    rules: ruleIds.filter((id) => ['design-system', 'code-convention'].includes(id)),
    skill: 'convert-external',
    skillResources: ['convert-external--conversion-checklist'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: '리팩토링',
    rules: ruleIds.filter((id) => ['code-convention'].includes(id)),
    skill: 'component-work',
    skillResources: ['component-work--refactoring-guide'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: '테마/스타일 수정',
    rules: ruleIds.filter((id) => ['design-system'].includes(id)),
    skillResources: ['component-work--mui-theme'].filter((id) => nodes.some((n) => n.id === id)),
  },
  {
    task: 'Grid 사용',
    rules: ruleIds.filter((id) => ['mui-grid-usage'].includes(id)),
  },
];

// ── 출력 ──

const output = `/**
 * 프로젝트 룰 관계 데이터 (자동 생성)
 *
 * 이 파일은 scripts/generate-rules.js 에 의해 자동 생성됩니다.
 * 직접 수정하지 마세요. 수정이 필요하면 스크립트를 수정하세요.
 *
 * 생성: pnpm generate-rules
 * 생성일: ${new Date().toISOString().slice(0, 10)}
 */

export const priorityMeta = {
  root: { color: '#000000', label: 'Root', order: 0 },
  CRITICAL: { color: '#D32F2F', label: '절대 위반 불가', order: 1 },
  MUST: { color: '#ED6C02', label: '반드시 준수', order: 2 },
  SHOULD: { color: '#0288D1', label: '관련 작업 시 준수', order: 3 },
  Skill: { color: '#7B1FA2', label: 'Skill (의도 기반 활성화)', order: 4 },
  'Skill Resource': { color: '#9E9E9E', label: 'Skill Resource (on-demand)', order: 5 },
  'Codex Skill': { color: '#00897B', label: 'Codex Skill (.agents/skills)', order: 6 },
  'Codex Agent': { color: '#5E35B1', label: 'Codex Subagent (.codex/agents)', order: 7 },
};

export const ruleNodes = ${JSON.stringify(nodes, null, 2)};

export const edgeTypes = {
  loads: { label: '자동 로드', style: 'solid' },
  references: { label: '텍스트 참조', style: 'dashed' },
  conditional: { label: '조건부 참조', style: 'dotted' },
  activates: { label: '의도 기반 활성화', style: 'solid' },
  resources: { label: 'on-demand Read', style: 'dashed' },
};

export const ruleEdges = ${JSON.stringify(edges, null, 2)};

export const conditionMatrix = ${JSON.stringify(conditionMatrix, null, 2)};
`;

writeFileSync(OUT, output, 'utf-8');

const ruleCount = nodes.filter((n) => ['CRITICAL', 'MUST', 'SHOULD'].includes(n.priority)).length;
const skillCount = nodes.filter((n) => n.priority === 'Skill').length;
const resourceCount = nodes.filter((n) => n.priority === 'Skill Resource').length;
const codexSkillCount = nodes.filter((n) => n.priority === 'Codex Skill').length;
const codexAgentCount = nodes.filter((n) => n.priority === 'Codex Agent').length;

console.log(`Generated ${OUT}`);
console.log(`  Rules: ${ruleCount}, Skills: ${skillCount}, Resources: ${resourceCount}`);
console.log(`  Codex Skills: ${codexSkillCount}, Codex Agents: ${codexAgentCount}`);
console.log(`  Edges: ${edges.length}, Conditions: ${conditionMatrix.length}`);
