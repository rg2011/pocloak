import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface SwimlaneHeader {
  x: number;
  y?: number;
  width?: number;
  height?: number;
  label: string;
}

export interface SwimlaneStep {
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
}

export interface SwimlaneStepSpec {
  id: string;
  lane: number;
  order: number;
  text: string;
}

export interface SwimlaneLinkSpec {
  from: string;
  to: string;
}

export interface SwimlaneDiagram {
  // SVG viewBox, e.g. "0 0 1200 760"
  viewBox: string;
  ariaLabel: string;
  markerId: string;
  // X coordinates for vertical lane separators.
  laneDividers: number[];
  headers: SwimlaneHeader[];
  // SVG path commands (M/H/V) used to draw connector arrows between steps.
  arrows: string[];
  steps: SwimlaneStep[];
}

export interface SwimlaneDiagramSpec {
  viewBox: string;
  ariaLabel: string;
  markerId: string;
  steps: SwimlaneStepSpec[];
  links: SwimlaneLinkSpec[];
  headers?: SwimlaneHeader[];
  layout?: Partial<SwimlaneLayoutConfig>;
}

export interface SwimlaneLayoutConfig {
  stepWidth: number;
  stepHeight: number;
  startY: number;
  stepGapY: number;
  laneCenters?: number[];
  laneDividers?: number[];
}

const DEFAULT_LAYOUT: SwimlaneLayoutConfig = {
  stepWidth: 280,
  stepHeight: 56,
  startY: 75,
  stepGapY: 50
};

function laneLeftX(lane: number, layout: SwimlaneLayoutConfig): number {
  if (!layout.laneCenters) {
    throw new Error('Swimlane layout requires laneCenters');
  }
  return layout.laneCenters[lane] - layout.stepWidth / 2;
}

function stepY(order: number, layout: SwimlaneLayoutConfig): number {
  return layout.startY + (order - 1) * layout.stepGapY;
}

function buildPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  layout: SwimlaneLayoutConfig
): string {
  const fromCenterX = from.x + layout.stepWidth / 2;
  const toCenterX = to.x + layout.stepWidth / 2;
  const midY = from.y + layout.stepHeight / 2;
  const isGoingDown = to.y >= from.y;
  const targetY = isGoingDown ? to.y - 2 : to.y + layout.stepHeight + 2;

  // SVG path commands:
  // Mx y = move; Hx = horizontal line; Vy = vertical line
  if (fromCenterX === toCenterX) {
    return `M${fromCenterX} ${midY} V${targetY}`;
  }

  const direction = toCenterX > fromCenterX ? 1 : -1;
  const fromEdgeX = fromCenterX + direction * (layout.stepWidth / 2);
  return `M${fromEdgeX} ${midY} H${toCenterX} V${targetY}`;
}

function parseViewBoxWidth(viewBox: string): number {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return Number.isFinite(parts[2]) && parts[2] > 0 ? parts[2] : 1200;
}

function distributeLaneCenters(columnCount: number, viewBoxWidth: number): number[] {
  if (columnCount < 2) {
    return [Math.round(viewBoxWidth / 2)];
  }

  const spacing = viewBoxWidth / columnCount;
  const start = spacing / 2;
  return Array.from({ length: columnCount }, (_, index) => Math.round(start + spacing * index));
}

export function createSwimlaneDiagram(
  spec: SwimlaneDiagramSpec,
  headers: SwimlaneHeader[],
  layout: SwimlaneLayoutConfig = DEFAULT_LAYOUT
): SwimlaneDiagram {
  const resolvedHeaders = spec.headers || headers;
  const viewBoxWidth = parseViewBoxWidth(spec.viewBox);
  const distributedCenters = distributeLaneCenters(resolvedHeaders.length, viewBoxWidth);
  const laneCenters = spec.layout?.laneCenters || layout.laneCenters || distributedCenters;
  const laneDividers = spec.layout?.laneDividers || layout.laneDividers || laneCenters;
  const resolvedLayout: SwimlaneLayoutConfig = {
    ...layout,
    ...spec.layout,
    laneCenters,
    laneDividers
  };

  const steps = spec.steps.map((step) => ({
    id: step.id,
    x: laneLeftX(step.lane, resolvedLayout),
    y: stepY(step.order, resolvedLayout),
    text: step.text,
    width: resolvedLayout.stepWidth,
    height: resolvedLayout.stepHeight
  }));

  const index = new Map(steps.map((step) => [step.id, step]));
  const arrows = spec.links.map((link) => {
    const from = index.get(link.from);
    const to = index.get(link.to);
    if (!from || !to) {
      throw new Error(`Invalid swimlane link: ${link.from} -> ${link.to}`);
    }
    return buildPath(from, to, resolvedLayout);
  });

  return {
    viewBox: spec.viewBox,
    ariaLabel: spec.ariaLabel,
    markerId: spec.markerId,
    laneDividers,
    headers: resolvedHeaders,
    arrows,
    steps: steps.map(({ id, ...step }) => step)
  };
}

@Component({
  selector: 'app-swimlane-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.viewBox]="diagram.viewBox"
      role="img"
      [attr.aria-label]="diagram.ariaLabel"
      style="width: 100%; height: auto;"
    >
      <line
        *ngFor="let divider of diagram.laneDividers"
        [attr.x1]="divider"
        y1="50"
        [attr.x2]="divider"
        [attr.y2]="computedDiagramBottomY"
        stroke="#dbdbdb"
      ></line>

      <g *ngFor="let header of diagram.headers">
        <rect
          [attr.x]="header.x - (header.width || 210) / 2"
          [attr.y]="header.y || 8"
          [attr.width]="header.width || 210"
          [attr.height]="header.height || 30"
          rx="4"
          fill="#e6e6e6"
          stroke="#d9d9d9"
        ></rect>
        <text
          [attr.x]="header.x"
          [attr.y]="(header.y || 8) + 21"
          text-anchor="middle"
          font-size="18"
          font-weight="700"
          fill="#111111"
        >
          {{ header.label }}
        </text>
      </g>

      <path
        *ngFor="let arrow of diagram.arrows"
        [attr.d]="arrow"
        fill="none"
        stroke="#d97706"
        stroke-width="2"
        [attr.marker-end]="'url(#' + diagram.markerId + ')'"
      ></path>

      <g *ngFor="let step of diagram.steps">
        <rect
          [attr.x]="step.x"
          [attr.y]="step.y"
          [attr.width]="step.width || 230"
          [attr.height]="step.height || 44"
          rx="4"
          fill="#ededed"
          stroke="#dbdbdb"
        ></rect>
        <text
          [attr.x]="step.x + (step.width || 230) / 2"
          [attr.y]="step.y + (step.height || 44) / 2 + 5"
          text-anchor="middle"
          font-size="14"
        >
          {{ step.text }}
        </text>
      </g>

      <defs>
        <marker [attr.id]="diagram.markerId" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <path d="M0,0 L7,2.5 L0,5 z" fill="#d97706"></path>
        </marker>
      </defs>
    </svg>
  `
})
export class SwimlaneDiagramComponent {
  @Input({ required: true }) diagram!: SwimlaneDiagram;
  @Input() diagramBottomY?: number;

  get computedDiagramBottomY(): number {
    if (typeof this.diagramBottomY === 'number') {
      return this.diagramBottomY;
    }

    const bottoms = this.diagram.steps.map((step) => step.y + (step.height || 44));
    const maxStepBottom = bottoms.length ? Math.max(...bottoms) : 120;
    return maxStepBottom + 40;
  }
}
