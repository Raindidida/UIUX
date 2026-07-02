import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type Mode = "hero" | "board" | "curve"

const entries = [
    ["01", "roboto-g2-mix", "w7f3a...e21", "0.847 +/- .011", "+0.092", "Champion", "70%"],
    ["02", "ft-dexgrasp-d4", "i90bd...ac", "0.831 +/- .014", "+0.076", "Challenger", "15%"],
    ["03", "pi05-ftk-rev9", "m12e8...b30", "0.804 +/- .009", "+0.049", "Challenger", "10%"],
    ["04", "grasp-mix-s2", "n5c01...df", "0.776 +/- .013", "+0.021", "Challenger", "5%"],
    ["05", "base-pi0.5-ref", "reference", "0.755 +/- .012", "-", "Base", "-"],
    ["06", "handover-tune-b1", "j8a44...fe", "0.749 +/- .016", "-0.006", "Not qualified", "-"],
]

const logs = [
    "R07 - w7f3a...e21 submitted roboto-g2-mix",
    "R07 - eval seed 1/3 - mu=0.842",
    "R07 - eval seed 3/3 - mu=0.847 +/- .011",
    "R07 - +0.092 vs base - QUALIFIED",
    "R07 - NEW CHAMPION roboto-g2-mix",
    "R07 - i90bd...ac challenge accepted",
    "R07 - ft-dexgrasp-d4 -> rank 02 - +0.076",
]

function useCountdown() {
    const [value, setValue] = React.useState("17:42:11")

    React.useEffect(() => {
        let target = Date.now() + (17 * 3600 + 42 * 60 + 11) * 1000
        const tick = () => {
            let ms = target - Date.now()
            if (ms < 0) {
                target = Date.now() + 7 * 24 * 3600 * 1000
                ms = target - Date.now()
            }
            const s = Math.floor(ms / 1000)
            const h = Math.floor(s / 3600)
            const m = Math.floor((s % 3600) / 60)
            const ss = s % 60
            setValue(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`)
        }
        tick()
        const id = window.setInterval(tick, 1000)
        return () => window.clearInterval(id)
    }, [])

    return value
}

function Curve() {
    const points = [
        [36, 234],
        [101, 198],
        [166, 176],
        [231, 158],
        [296, 140],
        [361, 107],
        [426, 82],
        [491, 60],
    ]
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ")
    const area = `${d} L491 260 L36 260 Z`

    return (
        <div style={styles.curveBox}>
            <svg viewBox="0 0 528 300" style={{ width: "100%", height: "100%" }}>
                {[80, 140, 200, 260].map((y) => (
                    <line key={y} x1="36" x2="500" y1={y} y2={y} stroke="rgba(255,255,255,.07)" />
                ))}
                <path d={area} fill="rgba(115,240,182,.10)" />
                <path d={d} fill="none" stroke="#73F0B6" strokeWidth="2.5" strokeLinejoin="round" />
                {points.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3.2} fill={i === points.length - 1 ? "#E9C27A" : "#73F0B6"} />
                ))}
                <text x="486" y="42" textAnchor="end" fill="#E9C27A" fontSize="12" fontFamily="JetBrains Mono, monospace">
                    CHAMPION 0.847
                </text>
                {points.map(([x], i) => (
                    <text key={i} x={x} y="282" textAnchor="middle" fill="#586068" fontSize="10" fontFamily="JetBrains Mono, monospace">
                        g{String(i + 1).padStart(2, "0")}
                    </text>
                ))}
            </svg>
        </div>
    )
}

function HeroStage() {
    const timer = useCountdown()
    return (
        <div style={styles.stage}>
            <div style={styles.champion}>
                <div>
                    <div style={styles.goldLabel}>Current Champion</div>
                    <div style={styles.model}>roboto-g2-mix</div>
                    <div style={styles.meta}>builder w7f3a...e21 - pi0.5 lineage - gen 02</div>
                    <div style={styles.meta}>Holding 6d 14h - 3 challengers repelled - promoted to Base next rotation</div>
                </div>
                <div style={styles.scoreBlock}>
                    <div style={styles.score}>0.847</div>
                    <div style={styles.meta}>+/- 0.011 - 3 seeds</div>
                    <div style={styles.smallLabel}>LIBERO-pro success</div>
                </div>
            </div>
            <div style={styles.stageBar}>
                <span style={styles.live}><span style={styles.dot} />Live on testnet</span>
                <span>Next base rotation <b style={{ color: "#73F0B6" }}>{timer}</b></span>
                <span style={{ marginLeft: "auto", color: "#73F0B6" }}>Full board -></span>
            </div>
        </div>
    )
}

function Board() {
    return (
        <div style={styles.board}>
            <div style={styles.stats}>
                <Stat value="6d 14h" label="Champion holding" />
                <Stat value="24" label="Active builders" />
                <Stat value="10" label="Submissions" />
                <Stat value="+0.092" label="Base -> champ gain" accent />
            </div>
            <div style={styles.boardGrid}>
                <div style={styles.tablePanel}>
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {["Rank", "Model", "Builder", "Score", "Delta", "Status", "Emission"].map((h) => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((row) => (
                                    <tr key={row[0]} style={row[0] === "01" ? styles.champRow : undefined}>
                                        {row.map((cell, i) => (
                                            <td key={i} style={{ ...styles.td, ...(i === 4 && cell.startsWith("+") ? styles.up : null), ...(i === 4 && cell.startsWith("-") ? styles.down : null) }}>
                                                {i === 5 ? <span style={badgeStyle(cell)}>{cell}</span> : cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={styles.foot}>Scored by every validator independently - Yuma consensus - no central scorekeeper</div>
                </div>
                <div style={styles.log}>
                    <div style={styles.logHead}><span style={styles.dot} />Event stream</div>
                    {logs.map((log, i) => (
                        <div key={i} style={styles.logLine}>
                            <span style={{ color: "#363C43" }}>12:{String(30 + i).padStart(2, "0")}:04</span> <span>{log}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={styles.rules}>
                <span>Qualify: beat Base by <b>{">= 1.0pp"}</b>, clear seed noise</span>
                <span>Emission <b>70 / 15 / 10 / 5</b> to top-4</span>
                <span>Unclaimed shares <b>reflow to the Base holder</b></span>
            </div>
        </div>
    )
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
    return (
        <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: accent ? "#73F0B6" : "#F1F3F4" }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    )
}

function badgeStyle(label: string): React.CSSProperties {
    const color = label === "Champion" ? "#E9C27A" : label === "Challenger" ? "#73F0B6" : label === "Not qualified" ? "#FF8D8D" : "#959CA3"
    return {
        color,
        border: `1px solid ${color}66`,
        borderRadius: 3,
        padding: "4px 8px",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: ".08em",
    }
}

export default function OpenRobotoLiveBoard(props: { mode: Mode }) {
    if (props.mode === "hero") return <HeroStage />
    if (props.mode === "curve") return <Curve />
    return <Board />
}

addPropertyControls(OpenRobotoLiveBoard, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["hero", "board", "curve"],
        optionTitles: ["Hero Stage", "Live Board", "Curve"],
        defaultValue: "board",
    },
})

const mono = "JetBrains Mono, SF Mono, ui-monospace, Menlo, monospace"
const display = "Space Grotesk, Inter, sans-serif"

const styles: Record<string, React.CSSProperties> = {
    stage: {
        width: "100%",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.075)",
        borderRadius: 12,
        background: "rgba(14,16,20,.72)",
        color: "#F1F3F4",
        fontFamily: mono,
    },
    champion: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        gap: 30,
        alignItems: "center",
        padding: 34,
        background: "linear-gradient(90deg, rgba(233,194,122,.08), transparent 62%)",
        borderBottom: "1px solid rgba(255,255,255,.075)",
    },
    goldLabel: { color: "#E9C27A", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase" },
    model: { marginTop: 12, fontFamily: display, fontSize: 38, lineHeight: 1, letterSpacing: "-.03em", fontWeight: 600 },
    meta: { marginTop: 10, color: "#959CA3", fontSize: 12, letterSpacing: ".02em" },
    scoreBlock: { textAlign: "right" },
    score: { fontFamily: display, color: "#73F0B6", fontSize: 58, lineHeight: 1, fontWeight: 600, letterSpacing: "-.03em" },
    smallLabel: { marginTop: 10, color: "#586068", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".13em" },
    stageBar: { display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", padding: "18px 34px", color: "#959CA3", fontSize: 12 },
    live: { display: "inline-flex", alignItems: "center", gap: 9, color: "#73F0B6", textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11 },
    dot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#73F0B6", boxShadow: "0 0 8px #73F0B6" },
    board: { width: "100%", color: "#F1F3F4", fontFamily: mono },
    stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", border: "1px solid rgba(255,255,255,.075)", borderRadius: 10, overflow: "hidden", marginBottom: 16 },
    stat: { padding: 20, borderLeft: "1px solid rgba(255,255,255,.075)" },
    statValue: { fontFamily: display, fontSize: 26, fontWeight: 600, lineHeight: 1 },
    statLabel: { marginTop: 10, color: "#586068", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em" },
    boardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 },
    tablePanel: { border: "1px solid rgba(255,255,255,.075)", borderRadius: 10, overflow: "hidden", background: "rgba(14,16,20,.66)" },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: 13 },
    th: { padding: "15px 18px", color: "#586068", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".13em", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,.075)" },
    td: { padding: "15px 18px", color: "#959CA3", borderBottom: "1px solid rgba(255,255,255,.045)", whiteSpace: "nowrap" },
    champRow: { background: "rgba(233,194,122,.055)" },
    up: { color: "#73F0B6" },
    down: { color: "#FF8D8D" },
    foot: { padding: "15px 18px", color: "#586068", fontSize: 11, borderTop: "1px solid rgba(255,255,255,.075)" },
    log: { border: "1px solid rgba(255,255,255,.075)", borderRadius: 10, padding: 18, background: "rgba(14,16,20,.66)", minHeight: 260 },
    logHead: { display: "flex", alignItems: "center", gap: 9, color: "#586068", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 },
    logLine: { color: "#959CA3", fontSize: 11, lineHeight: 2 },
    rules: { display: "flex", gap: 26, flexWrap: "wrap", marginTop: 18, color: "#586068", fontSize: 11.5 },
    curveBox: { width: "100%", height: "100%", minHeight: 280, border: "1px solid rgba(255,255,255,.075)", borderRadius: 10, background: "rgba(14,16,20,.5)", padding: 16 },
}
