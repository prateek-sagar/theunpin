import "./CollectorMachine.css";

/* CollectorMachine — a flat, geometric checkpoint. Threads enter at the left
   (ENTRY_PORT) and leave at the right (EXIT_PORT). This step is drawing only:
   no threads, no motion, no interaction. Size, stage count, port height and
   colours are all driven by the constants and CSS variables below. */

/* Geometry, in viewBox units. */
const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 400;

const HOUSING_X = 170;
const HOUSING_Y = 60;
const HOUSING_WIDTH = 280;
const HOUSING_HEIGHT = 280;

const PORT_HEIGHT = 32;
const PORT_CENTER_RATIO = 0.46; // ports sit slightly above the vertical middle

const STAGE_COUNT = 3; // 3 stages -> STAGE_COUNT - 1 internal dividers
const NOZZLE_LENGTH = 55;
const INLET_LENGTH = 60;

/* Derived edges and port centres. */
const HOUSING_RIGHT = HOUSING_X + HOUSING_WIDTH;
const HOUSING_BOTTOM = HOUSING_Y + HOUSING_HEIGHT;
const INLET_X = HOUSING_X - INLET_LENGTH;
const NOZZLE_END_X = HOUSING_RIGHT + NOZZLE_LENGTH;

const PORT_CENTER_Y = VIEWBOX_HEIGHT * PORT_CENTER_RATIO;
const PORT_TOP = PORT_CENTER_Y - PORT_HEIGHT / 2;
const PORT_BOTTOM = PORT_CENTER_Y + PORT_HEIGHT / 2;

const ENTRY_PORT_X = HOUSING_X;
const EXIT_PORT_X = NOZZLE_END_X;

const toPercentX = (x) => Math.round((x / VIEWBOX_WIDTH) * 100000) / 1000;
const toPercentY = (y) => Math.round((y / VIEWBOX_HEIGHT) * 100000) / 1000;

/* Port anchors. ThreadField reads ENTRY_PORT and EXIT_PORT so its threads pass
   exactly through the port centres once the machine is integrated. Each anchor
   gives the centre in viewBox units (x, y), the port height, and the same point
   as a percentage of the viewBox width and height. Both ports share one
   horizontal centreline (46% from the top). */
export const ENTRY_PORT = {
  x: ENTRY_PORT_X,
  y: PORT_CENTER_Y,
  height: PORT_HEIGHT,
  xPercent: toPercentX(ENTRY_PORT_X),
  yPercent: toPercentY(PORT_CENTER_Y),
};

export const EXIT_PORT = {
  x: EXIT_PORT_X,
  y: PORT_CENTER_Y,
  height: PORT_HEIGHT,
  xPercent: toPercentX(EXIT_PORT_X),
  yPercent: toPercentY(PORT_CENTER_Y),
};

/* Internal stage dividers, evenly spaced across the housing interior. */
const STAGE_MARGIN = 26;
const STAGE_INNER_LEFT = HOUSING_X + STAGE_MARGIN;
const STAGE_INNER_RIGHT = HOUSING_RIGHT - STAGE_MARGIN;
const DIVIDER_TOP = HOUSING_Y + 30;
const DIVIDER_BOTTOM = HOUSING_BOTTOM - 30;

const DIVIDER_XS = Array.from({ length: STAGE_COUNT - 1 }, (_, i) =>
  STAGE_INNER_LEFT +
  ((i + 1) / STAGE_COUNT) * (STAGE_INNER_RIGHT - STAGE_INNER_LEFT)
);

/* One small segmented block between the first two dividers. */
const SEGMENT_COUNT = 3;
const SEGMENT_WIDTH = 4;
const SEGMENT_GAP = 4;
const SEGMENT_HEIGHT = 22;
const SEGMENT_CENTER_X =
  DIVIDER_XS.length >= 2 ? (DIVIDER_XS[0] + DIVIDER_XS[1]) / 2 : 0;
const SEGMENT_TOTAL_WIDTH =
  SEGMENT_COUNT * SEGMENT_WIDTH + (SEGMENT_COUNT - 1) * SEGMENT_GAP;
const SEGMENT_START_X = SEGMENT_CENTER_X - SEGMENT_TOTAL_WIDTH / 2;

/* Blueprint registration ticks at the four viewBox corners. */
const TICK_INSET = 14;
const TICK_LENGTH = 12;

export default function CollectorMachine() {
  return (
    <div className="collector-machine">
      <svg
        className="collector-machine-svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {/* 1. Housing */}
        <rect
          className="collector-machine-body"
          x={HOUSING_X}
          y={HOUSING_Y}
          width={HOUSING_WIDTH}
          height={HOUSING_HEIGHT}
        />
        <path
          className="collector-machine-outline"
          d={`M${HOUSING_X} ${PORT_TOP} L${HOUSING_X} ${HOUSING_Y} L${HOUSING_RIGHT} ${HOUSING_Y} L${HOUSING_RIGHT} ${HOUSING_BOTTOM} L${HOUSING_X} ${HOUSING_BOTTOM} L${HOUSING_X} ${PORT_BOTTOM}`}
        />

        {/* 2. Inlet funnel — narrows to the entry port, whose end stays open. */}
        <path
          className="collector-machine-body"
          d={`M${INLET_X} ${HOUSING_Y} L${HOUSING_X} ${PORT_TOP} L${HOUSING_X} ${PORT_BOTTOM} L${INLET_X} ${HOUSING_BOTTOM} Z`}
        />
        <path
          className="collector-machine-outline"
          d={`M${INLET_X} ${HOUSING_Y} L${HOUSING_X} ${PORT_TOP} M${HOUSING_X} ${PORT_BOTTOM} L${INLET_X} ${HOUSING_BOTTOM} M${INLET_X} ${HOUSING_Y} L${INLET_X} ${HOUSING_BOTTOM}`}
        />

        {/* 3. Entry port is the open gap left in the housing outline above. */}

        {/* 4. Internal stages */}
        {DIVIDER_XS.map((x) => (
          <line
            key={`divider-${x}`}
            className="collector-machine-divider"
            x1={x}
            y1={DIVIDER_TOP}
            x2={x}
            y2={DIVIDER_BOTTOM}
          />
        ))}
        {DIVIDER_XS.length >= 2 && (
          <g className="collector-machine-segment">
            {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
              <rect
                key={`segment-${i}`}
                x={SEGMENT_START_X + i * (SEGMENT_WIDTH + SEGMENT_GAP)}
                y={PORT_CENTER_Y - SEGMENT_HEIGHT / 2}
                width={SEGMENT_WIDTH}
                height={SEGMENT_HEIGHT}
              />
            ))}
          </g>
        )}

        {/* 5. Exit nozzle */}
        <rect
          className="collector-machine-body"
          x={HOUSING_RIGHT}
          y={PORT_TOP}
          width={NOZZLE_LENGTH}
          height={PORT_HEIGHT}
        />
        <path
          className="collector-machine-outline"
          d={`M${HOUSING_RIGHT} ${PORT_TOP} L${NOZZLE_END_X} ${PORT_TOP} M${HOUSING_RIGHT} ${PORT_BOTTOM} L${NOZZLE_END_X} ${PORT_BOTTOM}`}
        />

        {/* 6. Exit port is the open end of the nozzle above. */}

        {/* 7. Accent — the only teal element. */}
        <circle
          className="collector-machine-accent"
          cx={HOUSING_X + 26}
          cy={HOUSING_Y + 24}
          r="4"
        />

        {/* Blueprint registration ticks. */}
        <path
          className="collector-machine-tick"
          d={`M${TICK_INSET} ${TICK_INSET + TICK_LENGTH} L${TICK_INSET} ${TICK_INSET} L${TICK_INSET + TICK_LENGTH} ${TICK_INSET}`}
        />
        <path
          className="collector-machine-tick"
          d={`M${VIEWBOX_WIDTH - TICK_INSET - TICK_LENGTH} ${TICK_INSET} L${VIEWBOX_WIDTH - TICK_INSET} ${TICK_INSET} L${VIEWBOX_WIDTH - TICK_INSET} ${TICK_INSET + TICK_LENGTH}`}
        />
        <path
          className="collector-machine-tick"
          d={`M${TICK_INSET} ${VIEWBOX_HEIGHT - TICK_INSET - TICK_LENGTH} L${TICK_INSET} ${VIEWBOX_HEIGHT - TICK_INSET} L${TICK_INSET + TICK_LENGTH} ${VIEWBOX_HEIGHT - TICK_INSET}`}
        />
        <path
          className="collector-machine-tick"
          d={`M${VIEWBOX_WIDTH - TICK_INSET - TICK_LENGTH} ${VIEWBOX_HEIGHT - TICK_INSET} L${VIEWBOX_WIDTH - TICK_INSET} ${VIEWBOX_HEIGHT - TICK_INSET} L${VIEWBOX_WIDTH - TICK_INSET} ${VIEWBOX_HEIGHT - TICK_INSET - TICK_LENGTH}`}
        />
      </svg>
    </div>
  );
}
