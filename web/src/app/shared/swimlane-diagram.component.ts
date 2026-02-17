import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface SwimlaneHeader {
  x: number;
  label: string;
}

export interface SwimlaneStep {
  x: number;
  y: number;
  text: string;
  width?: number;
}

export interface SwimlaneDiagram {
  viewBox: string;
  ariaLabel: string;
  markerId: string;
  laneDividers: number[];
  headers: SwimlaneHeader[];
  arrows: string[];
  steps: SwimlaneStep[];
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
          [attr.x]="header.x - 105"
          y="8"
          width="210"
          height="30"
          rx="4"
          fill="#e6e6e6"
          stroke="#d9d9d9"
        ></rect>
        <text
          [attr.x]="header.x"
          y="29"
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
          height="44"
          rx="4"
          fill="#ededed"
          stroke="#dbdbdb"
        ></rect>
        <text
          [attr.x]="step.x + (step.width || 230) / 2"
          [attr.y]="step.y + 27"
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

  get computedDiagramBottomY(): number {
    const bottoms = this.diagram.steps.map((step) => step.y + 44);
    const maxStepBottom = bottoms.length ? Math.max(...bottoms) : 120;
    return maxStepBottom + 40;
  }
}
