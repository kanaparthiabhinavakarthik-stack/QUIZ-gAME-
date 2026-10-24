import { useCallback, useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

type ChoiceKey = "A" | "B" | "C" | "D"
interface QuestionControlItem { chapter: string; prompt: string; scenario: string; optionA: string; reflectionA: string; themeA: string; optionB: string; reflectionB: string; themeB: string; optionC: string; reflectionC: string; themeC: string; optionD: string; reflectionD: string; themeD: string }
interface MyComponentProps { title: string; subtitle: string; accentColor: string; backgroundColor: string; surfaceColor: string; textColor: string; mutedColor: string; font: { fontSize?: string | number; lineHeight?: string | number; letterSpacing?: string | number; fontWeight?: number; fontStyle?: "normal" | "italic"; fontFamily?: string; textAlign?: "left" | "center" | "right" }; questions: QuestionControlItem[]; style?: CSSProperties }
interface SavedState { currentIndex: number; answers: Record<number, ChoiceKey> }
const STORAGE_KEY = "inner-orbit-progress-v1"
const CHAPTER_TITLES = ["The familiar self", "Beneath the surface", "The stories we tell", "At a crossroads", "Becoming"]
const DEFAULT_QUESTIONS: QuestionControlItem[] = [
{ chapter: CHAPTER_TITLES[0], prompt: "When your day unexpectedly opens up, what feels most restorative?", scenario: "A free afternoon appears with no obligations.", optionA: "Call someone I trust and catch up.", reflectionA: "You often refuel through meaningful connection.", themeA: "Connection", optionB: "Take a solo walk without a destination.", reflectionB: "You create clarity by making space for yourself.", themeB: "Clarity", optionC: "Tackle one practical thing I’ve been postponing.", reflectionC: "You steady yourself through tangible progress.", themeC: "Grounding", optionD: "Try something playful and unplanned.", reflectionD: "You stay alive to possibility through experimentation.", themeD: "Exploration" },
{ chapter: CHAPTER_TITLES[0], prompt: "Which feedback is hardest to hear, even when well meant?", scenario: "A close friend offers honest input about your habits.", optionA: "That I avoid conflict.", reflectionA: "You may protect harmony, even at personal cost.", themeA: "Boundaries", optionB: "That I overthink simple decisions.", reflectionB: "You might seek certainty before allowing movement.", themeB: "Control", optionC: "That I seem distant when stressed.", reflectionC: "Stress can make you retreat before reconnecting.", themeC: "Vulnerability", optionD: "That I downplay my own needs.", reflectionD: "You may be practiced at self-minimizing to keep balance.", themeD: "Self-Worth" },
{ chapter: CHAPTER_TITLES[0], prompt: "What usually guides your first instinct in a tough moment?", scenario: "Plans collapse right before an important deadline.", optionA: "Who needs support first?", reflectionA: "You orient quickly toward collective care.", themeA: "Responsibility", optionB: "What is still within my control?", reflectionB: "You regain footing through structure and agency.", themeB: "Control", optionC: "What meaning can I make from this?", reflectionC: "You naturally search for insight during disruption.", themeC: "Meaning", optionD: "How do I protect my energy right now?", reflectionD: "You value sustainability over immediate performance.", themeD: "Boundaries" },
{ chapter: CHAPTER_TITLES[1], prompt: "When you feel misunderstood, what do you tend to do?", scenario: "Someone close interprets your intention incorrectly.", optionA: "Explain carefully until we align.", reflectionA: "You lean on language to rebuild trust.", themeA: "Communication", optionB: "Give it time, then revisit later.", reflectionB: "You prefer perspective over immediacy.", themeB: "Patience", optionC: "Withdraw and process privately first.", reflectionC: "You need internal processing before engagement.", themeC: "Clarity", optionD: "Accept it and move on quickly.", reflectionD: "You may prioritize momentum over resolution.", themeD: "Adaptability" },
{ chapter: CHAPTER_TITLES[1], prompt: "Which inner voice appears most often before a risk?", scenario: "A meaningful opportunity appears with uncertain outcomes.", optionA: "Do it. Growth comes from motion.", reflectionA: "You often trust expansion more than certainty.", themeA: "Growth", optionB: "Wait. Prepare more first.", reflectionB: "You honor readiness as part of wise action.", themeB: "Preparation", optionC: "Ask others what they think.", reflectionC: "You value relational perspective in uncertain moments.", themeC: "Connection", optionD: "If it matters, fear can come with me.", reflectionD: "You can act without requiring perfect confidence.", themeD: "Courage" },
{ chapter: CHAPTER_TITLES[1], prompt: "Where do you most often compromise with yourself?", scenario: "Your commitments exceed your emotional bandwidth.", optionA: "Rest and recovery.", reflectionA: "Recovery may be the first thing traded for output.", themeA: "Sustainability", optionB: "Creative expression.", reflectionB: "Your own voice can get postponed by urgency.", themeB: "Identity", optionC: "Boundaries with others.", reflectionC: "You may overextend before renegotiating limits.", themeC: "Boundaries", optionD: "Long-term goals.", reflectionD: "Immediate demands can eclipse strategic direction.", themeD: "Direction" },
{ chapter: CHAPTER_TITLES[2], prompt: "What story about yourself are you currently rewriting?", scenario: "You notice an old belief no longer fits.", optionA: "I must prove my value to belong.", reflectionA: "You’re reconsidering worth as inherent, not earned.", themeA: "Self-Worth", optionB: "I have to do everything alone.", reflectionB: "You’re allowing support to be part of strength.", themeB: "Connection", optionC: "Change means I failed my plan.", reflectionC: "You’re opening to pivots as intelligence, not defeat.", themeC: "Adaptability", optionD: "If I slow down, I fall behind.", reflectionD: "You’re testing a pace that honors depth over speed.", themeD: "Sustainability" },
{ chapter: CHAPTER_TITLES[2], prompt: "What do you protect most in conversation?", scenario: "A difficult topic comes up with someone important.", optionA: "The relationship.", reflectionA: "You may prioritize connection even during tension.", themeA: "Connection", optionB: "My autonomy.", reflectionB: "You guard your agency as a core value.", themeB: "Autonomy", optionC: "My image of being capable.", reflectionC: "Competence may feel linked to safety for you.", themeC: "Identity", optionD: "The emotional tone.", reflectionD: "You track atmosphere and try to stabilize it.", themeD: "Harmony" },
{ chapter: CHAPTER_TITLES[2], prompt: "Which pattern tends to repeat when you feel pressure?", scenario: "Multiple priorities compete for your attention.", optionA: "Overcommitting to avoid disappointing people.", reflectionA: "Care for others can blur your own limits.", themeA: "Boundaries", optionB: "Overanalyzing before taking the first step.", reflectionB: "Your precision can delay momentum.", themeB: "Control", optionC: "Pushing through without noticing fatigue.", reflectionC: "You can outpace your own recovery signals.", themeC: "Sustainability", optionD: "Switching direction quickly to regain relief.", reflectionD: "Relief may drive quick pivots under stress.", themeD: "Adaptability" },
{ chapter: CHAPTER_TITLES[3], prompt: "How do you usually decide when two values conflict?", scenario: "A choice asks you to trade stability for meaning.", optionA: "Choose what preserves peace now.", reflectionA: "You may value immediate steadiness in transitions.", themeA: "Grounding", optionB: "Choose what aligns with future self.", reflectionB: "Long-range alignment shapes your decisions.", themeB: "Direction", optionC: "Choose after discussing with trusted people.", reflectionC: "Shared reflection helps you clarify stakes.", themeC: "Connection", optionD: "Choose and adjust as I learn.", reflectionD: "You trust iteration over perfect foresight.", themeD: "Exploration" },
{ chapter: CHAPTER_TITLES[3], prompt: "What does courage look like for you right now?", scenario: "You’re standing at the edge of an important step.", optionA: "Saying no where I used to say yes.", reflectionA: "Courage may mean redrawing your boundaries.", themeA: "Boundaries", optionB: "Saying yes where fear says no.", reflectionB: "Courage may mean moving with uncertainty.", themeB: "Courage", optionC: "Admitting what I really want.", reflectionC: "Courage may mean honest desire without apology.", themeC: "Identity", optionD: "Resting before I burn out.", reflectionD: "Courage may mean choosing sustainability over urgency.", themeD: "Sustainability" },
{ chapter: CHAPTER_TITLES[3], prompt: "When progress feels invisible, what keeps you going?", scenario: "You’re putting in effort without obvious results yet.", optionA: "Remembering previous turning points.", reflectionA: "You draw momentum from lived evidence.", themeA: "Resilience", optionB: "Rituals and routines.", reflectionB: "Consistency gives your effort a container.", themeB: "Grounding", optionC: "Encouragement from people I trust.", reflectionC: "Relational support strengthens your persistence.", themeC: "Connection", optionD: "A deep sense that this matters.", reflectionD: "Meaning anchors your commitment beyond outcomes.", themeD: "Meaning" },
{ chapter: CHAPTER_TITLES[4], prompt: "What kind of life rhythm are you moving toward?", scenario: "You can redesign one part of your weekly pace.", optionA: "Slower, with more intentional pauses.", reflectionA: "You may be moving toward depth and recovery.", themeA: "Sustainability", optionB: "Bolder, with more visible action.", reflectionB: "You may be leaning into momentum and presence.", themeB: "Courage", optionC: "Softer, with more self-acceptance.", reflectionC: "You may be practicing gentleness with yourself.", themeC: "Self-Worth", optionD: "Clearer, with firmer priorities.", reflectionD: "You may be strengthening direction through focus.", themeD: "Direction" },
{ chapter: CHAPTER_TITLES[4], prompt: "Which reminder would support you most this month?", scenario: "You leave this reflection with one sentence to keep.", optionA: "I can be evolving and still enough.", reflectionA: "You are integrating growth with self-acceptance.", themeA: "Self-Worth", optionB: "Boundaries can be an act of care.", reflectionB: "You are reframing limits as relational honesty.", themeB: "Boundaries", optionC: "Small steps still move the story forward.", reflectionC: "You trust accumulation over dramatic leaps.", themeC: "Grounding", optionD: "I don’t need perfect certainty to begin.", reflectionD: "You are cultivating action alongside ambiguity.", themeD: "Exploration" },
{ chapter: CHAPTER_TITLES[4], prompt: "As you continue, what do you want to carry forward?", scenario: "You close this journey and choose what remains central.", optionA: "More honesty with myself.", reflectionA: "Inner truth appears to be a guiding compass.", themeA: "Identity", optionB: "More trust in my pace.", reflectionB: "You are learning to honor your natural cadence.", themeB: "Sustainability", optionC: "More openness to support.", reflectionC: "You are inviting shared strength into your path.", themeC: "Connection", optionD: "More willingness to begin again.", reflectionD: "You are practicing renewal as a living skill.", themeD: "Resilience" },
]
function validateSavedState(value: unknown, total: number): SavedState | null {
 if (!value || typeof value !== "object") return null
 const maybe = value as SavedState
 if (typeof maybe.currentIndex !== "number" || !Number.isFinite(maybe.currentIndex)) return null
 if (!maybe.answers || typeof maybe.answers !== "object") return null
 const safeAnswers: Record<number, ChoiceKey> = {}
 for (const [key, choice] of Object.entries(maybe.answers)) { const index = Number(key); if (Number.isNaN(index) || index < 0 || index >= total) continue; if (choice === "A" || choice === "B" || choice === "C" || choice === "D") safeAnswers[index] = choice }
 const currentIndex = Math.max(0, Math.min(total, Math.floor(maybe.currentIndex)))
 return { currentIndex, answers: safeAnswers }
}
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function InnerOrbit(props: MyComponentProps) {
 const { title, subtitle, accentColor, backgroundColor, surfaceColor, textColor, mutedColor, font, questions = DEFAULT_QUESTIONS, style } = props
 const isStaticRenderer = useIsStaticRenderer()
 const safeQuestions = questions.length > 0 ? questions : DEFAULT_QUESTIONS
 const totalQuestions = safeQuestions.length
 const [currentIndex, setCurrentIndex] = useState(0)
 const [answers, setAnswers] = useState<Record<number, ChoiceKey>>({})
 const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null)
 const [showChoiceReflection, setShowChoiceReflection] = useState(false)
 const [showHowItWorks, setShowHowItWorks] = useState(false)
 const [showReflectionDialog, setShowReflectionDialog] = useState(false)
 const [viewportWidth, setViewportWidth] = useState(1200)
 const [reducedMotion, setReducedMotion] = useState(false)
 const [loaded, setLoaded] = useState(false)
 const rootRef = useRef<HTMLDivElement | null>(null)
 const dialogRef = useRef<HTMLDivElement | null>(null)
 const lastFocusedRef = useRef<HTMLElement | null>(null)
 useEffect(() => {
  if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") { const current = rootRef.current; if (!current) return; const observer = new ResizeObserver((entries) => { const next = entries[0]?.contentRect.width; if (typeof next === "number") startTransition(() => setViewportWidth(next)) }); observer.observe(current); return () => observer.disconnect() }
 }, [])
 useEffect(() => {
  if (typeof window !== "undefined") { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); startTransition(() => setReducedMotion(media.matches)); const listener = (event: MediaQueryListEvent) => startTransition(() => setReducedMotion(event.matches)); media.addEventListener("change", listener); return () => media.removeEventListener("change", listener) }
 }, [])
 useEffect(() => {
  if (isStaticRenderer) { startTransition(() => setLoaded(true)); return }
  if (typeof window !== "undefined") { try { const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return; const parsed = JSON.parse(raw); const valid = validateSavedState(parsed, totalQuestions); if (!valid) return; startTransition(() => { setCurrentIndex(valid.currentIndex); setAnswers(valid.answers); setSelectedChoice(valid.answers[valid.currentIndex] ?? null); setShowChoiceReflection(false) }) } catch (_error) {} finally { startTransition(() => setLoaded(true)) } } else { startTransition(() => setLoaded(true)) }
 }, [isStaticRenderer, totalQuestions])
 useEffect(() => { if (isStaticRenderer || !loaded) return; if (typeof window !== "undefined") { try { const payload: SavedState = { currentIndex, answers }; window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch (_error) {} } }, [answers, currentIndex, isStaticRenderer, loaded])
 useEffect(() => { const restored = answers[currentIndex] ?? null; startTransition(() => { setSelectedChoice(restored); setShowChoiceReflection(false) }) }, [currentIndex])
 const chapterStarts = useMemo(() => [0, 3, 6, 9, 12], [])
 const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
 const points = answeredCount * 10
 const maxPoints = totalQuestions * 10
 const currentChapterIndex = Math.min(4, Math.floor(Math.min(currentIndex, totalQuestions - 1) / 3))
 const unlockedChapterIndex = Math.min(4, Math.floor(answeredCount / 3))
 const isComplete = answeredCount === totalQuestions
 const onFinalScreen = currentIndex >= totalQuestions
 const isCompact = viewportWidth <= 800
 const isTiny = viewportWidth <= 560
 const chosenReflection = useMemo(() => { if (selectedChoice === null || !safeQuestions[currentIndex]) return ""; return safeQuestions[currentIndex][`reflection${selectedChoice}` as keyof QuestionControlItem] as string }, [currentIndex, safeQuestions, selectedChoice])
 const summary = useMemo(() => {
  const themeCounts: Record<string, number> = {}; const reflections: string[] = []
  const review = safeQuestions.map((q, index) => { const choice = answers[index]; if (!choice) return null; const optionText = q[`option${choice}` as keyof QuestionControlItem] as string; const reflectionText = q[`reflection${choice}` as keyof QuestionControlItem] as string; const theme = q[`theme${choice}` as keyof QuestionControlItem] as string; themeCounts[theme] = (themeCounts[theme] ?? 0) + 1; reflections.push(reflectionText); return { prompt: q.prompt, choice, optionText, reflectionText, theme, chapter: q.chapter } })
  const topThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([theme]) => theme)
  const reflectionBlend = reflections.slice(0, 3).join(" ")
  const narrative = topThemes.length > 0 ? `Your answers often orbit around ${topThemes.join(", ")}. ${reflectionBlend}` : "Keep answering to uncover your reflection pattern."
  return { review: review.filter(Boolean) as Array<any>, narrative, topThemes }
 }, [answers, safeQuestions])
 const handleChapterJump = useCallback((chapterIndex: number) => { if (chapterIndex > unlockedChapterIndex) return; const target = chapterStarts[chapterIndex]; if (typeof target !== "number" || target >= totalQuestions) return; startTransition(() => setCurrentIndex(target)) }, [chapterStarts, totalQuestions, unlockedChapterIndex])
 const handleContinue = useCallback(() => {
  if (selectedChoice === null || !safeQuestions[currentIndex]) return
  if (!showChoiceReflection) { startTransition(() => { setAnswers((prev) => ({ ...prev, [currentIndex]: selectedChoice })); setShowChoiceReflection(true) }); return }
  if (currentIndex >= totalQuestions - 1) { startTransition(() => { setCurrentIndex(totalQuestions); setShowChoiceReflection(false); setShowReflectionDialog(true) }) } else { startTransition(() => { setCurrentIndex((prev) => prev + 1); setShowChoiceReflection(false) }) }
 }, [currentIndex, safeQuestions, selectedChoice, showChoiceReflection, totalQuestions])
 const handleBack = useCallback(() => { if (onFinalScreen) { startTransition(() => setCurrentIndex(totalQuestions - 1)); return } if (showChoiceReflection) { startTransition(() => setShowChoiceReflection(false)); return } if (currentIndex > 0) startTransition(() => setCurrentIndex((prev) => prev - 1)) }, [currentIndex, onFinalScreen, showChoiceReflection, totalQuestions])
 const handleReset = useCallback(() => { if (typeof window !== "undefined") { const approved = window.confirm("Restart Inner Orbit? Your current reflection progress will be cleared."); if (!approved) return; try { window.localStorage.removeItem(STORAGE_KEY) } catch (_error) {} } startTransition(() => { setCurrentIndex(0); setAnswers({}); setSelectedChoice(null); setShowChoiceReflection(false); setShowReflectionDialog(false) }) }, [])
 useEffect(() => {
  const anyDialogOpen = showHowItWorks || showReflectionDialog; if (!anyDialogOpen) return
  if (typeof document !== "undefined") { lastFocusedRef.current = document.activeElement as HTMLElement | null; const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); focusable?.[0]?.focus() }
  const keyHandler = (event: KeyboardEvent) => {
   if (event.key === "Escape") { startTransition(() => { setShowHowItWorks(false); setShowReflectionDialog(false) }); return }
   if (event.key === "Tab" && dialogRef.current) { const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (focusable.length === 0) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; const active = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null; if (event.shiftKey && active === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus() } }
  }
  if (typeof window !== "undefined") { window.addEventListener("keydown", keyHandler); return () => { window.removeEventListener("keydown", keyHandler); lastFocusedRef.current?.focus() } }
 }, [showHowItWorks, showReflectionDialog])
 const activeQuestion = safeQuestions[Math.min(currentIndex, totalQuestions - 1)]
 const buttonBaseStyle: CSSProperties = { fontFamily: "inherit", fontSize: "inherit", outlineColor: accentColor, outlineOffset: 2 }
 return (
 <div ref={rootRef} style={{ ...style, position: "relative", width: "100%", minHeight: "100vh", background: backgroundColor, color: textColor, fontFamily: font.fontFamily || "Outfit, sans-serif", fontSize: font.fontSize, lineHeight: font.lineHeight, letterSpacing: font.letterSpacing, fontWeight: font.fontWeight, overflowX: "hidden", padding: isTiny ? 14 : 22, boxSizing: "border-box" }}>
  <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
   <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
     <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.8" /><ellipse cx="17" cy="17" rx="13" ry="6" fill="none" stroke={mutedColor} strokeWidth="1" /><circle cx="22.5" cy="11" r="2.2" fill={accentColor} /></svg>
     <div><h1 style={{ margin: 0, fontSize: isTiny ? 22 : 26, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{title}</h1><p style={{ margin: "4px 0 0 0", color: mutedColor, fontSize: 13 }}>{subtitle}</p></div>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
     <button onClick={() => startTransition(() => setShowHowItWorks(true))} style={{ ...buttonBaseStyle, background: "transparent", color: textColor, border: `1px solid ${mutedColor}`, borderRadius: 10, padding: "9px 14px", cursor: "pointer" }}>How it works</button>
     <button onClick={() => startTransition(() => setShowReflectionDialog(true))} style={{ ...buttonBaseStyle, background: "transparent", color: textColor, border: `1px solid ${accentColor}`, borderRadius: 10, padding: "9px 14px", cursor: "pointer" }}>Your reflection</button>
    </div>
   </header>
   <div style={{ height: 1, background: "rgba(149,156,145,0.3)", margin: "18px 0 18px" }} />
   <div style={{ display: "flex", flexDirection: isCompact ? "column" : "row", gap: 18 }}>
    <aside style={{ width: isCompact ? "100%" : 250, border: `1px solid rgba(149,156,145,0.3)`, background: surfaceColor, borderRadius: 16, padding: 14, boxSizing: "border-box" }}>
     <h2 style={{ margin: 0, fontSize: 12, color: mutedColor, letterSpacing: "0.08em" }}>JOURNEY</h2>
     <div style={{ display: "flex", flexDirection: isCompact ? "row" : "column", gap: 8, marginTop: 10, overflowX: isCompact ? "auto" : "visible" }}>
      {CHAPTER_TITLES.map((chapter, idx) => { const locked = idx > unlockedChapterIndex; const active = idx === currentChapterIndex && !onFinalScreen; return (
       <button key={chapter} onClick={() => handleChapterJump(idx)} disabled={locked} aria-disabled={locked} style={{ ...buttonBaseStyle, minWidth: isCompact ? 160 : "auto", textAlign: "left", background: active ? "rgba(211,247,122,0.12)" : "transparent", border: `1px solid ${active ? "rgba(211,247,122,0.45)" : "rgba(149,156,145,0.24)"}`, color: locked ? mutedColor : textColor, borderRadius: 10, padding: "9px 10px", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.55 : 1 }}><div style={{ fontSize: 11, color: mutedColor }}>0{idx + 1}</div><div style={{ fontSize: 13 }}>{chapter}</div></button>
      ) })}
     </div>
     <div style={{ marginTop: 12, borderTop: "1px solid rgba(149,156,145,0.25)", paddingTop: 12 }}>
      <svg width="100%" height="44" viewBox="0 0 180 44" aria-hidden="true"><ellipse cx="56" cy="22" rx="42" ry="14" fill="none" stroke={mutedColor} strokeOpacity="0.5" /><ellipse cx="56" cy="22" rx="25" ry="8" fill="none" stroke={accentColor} strokeOpacity="0.7" /><circle cx="83" cy="15" r="3" fill={accentColor} /></svg>
      <p style={{ margin: "6px 0 0 0", color: mutedColor, fontSize: 12 }}>Go inward. Find a new perspective.</p>
     </div>
    </aside>
    <main style={{ flex: 1, minWidth: 0 }}><div style={{ maxWidth: 820 }}>
     <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><p style={{ margin: 0, fontSize: 12, color: mutedColor, letterSpacing: "0.08em" }}>THE JOURNEY INWARD</p><h2 style={{ margin: "8px 0 6px 0", fontSize: isTiny ? 28 : 40, lineHeight: 1.05, letterSpacing: "-0.03em" }}>Meet the mind behind your answers.</h2><p style={{ margin: 0, color: mutedColor, fontSize: 15 }}>A game of questions. An exploration of you. No right answers. Just honest ones.</p></div>
      {!isTiny && (<svg width="140" height="90" viewBox="0 0 140 90" aria-hidden="true"><circle cx="70" cy="45" r="30" fill="none" stroke={mutedColor} strokeOpacity="0.5" /><circle cx="70" cy="45" r="18" fill="none" stroke={accentColor} strokeOpacity="0.7" /><circle cx="93" cy="41" r="4" fill={accentColor} /></svg>)}
     </div>
     <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{CHAPTER_TITLES.map((name, idx) => (<div key={name} style={{ borderRadius: 999, border: "1px solid rgba(149,156,145,0.3)", padding: "6px 10px", fontSize: 12, color: idx <= currentChapterIndex ? textColor : mutedColor, background: idx === currentChapterIndex && !onFinalScreen ? "rgba(211,247,122,0.12)" : "transparent" }}>{name}</div>))}</div>
      <p style={{ margin: 0, color: mutedColor, fontSize: 13 }}>{answeredCount}/{totalQuestions} answered · {points} points</p>
     </div>
     <section style={{ marginTop: 14, border: "1px solid rgba(149,156,145,0.35)", borderRadius: 16, background: surfaceColor, padding: isTiny ? 14 : 20 }}>
      {!onFinalScreen && activeQuestion ? (<>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><span style={{ border: "1px solid rgba(211,247,122,0.45)", color: accentColor, borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>{activeQuestion.chapter}</span><span style={{ color: mutedColor, fontSize: 12 }}>Question {(currentIndex + 1).toString().padStart(2, "0")} / {totalQuestions}</span></div>
       <h3 style={{ margin: "14px 0 6px 0", fontSize: isTiny ? 24 : 33, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{activeQuestion.prompt}</h3>
       <p style={{ margin: 0, color: mutedColor }}>{activeQuestion.scenario}</p>
       <div aria-label="Answer choices" style={{ display: "grid", gap: 10, marginTop: 16 }}>
        {(["A", "B", "C", "D"] as ChoiceKey[]).map((choice) => { const selected = selectedChoice === choice; const label = activeQuestion[`option${choice}` as keyof QuestionControlItem] as string; return (
         <button key={choice} aria-pressed={selected} onClick={() => startTransition(() => { setSelectedChoice(choice); setShowChoiceReflection(false) })} style={{ ...buttonBaseStyle, width: "100%", textAlign: "left", borderRadius: 10, border: `1px solid ${selected ? accentColor : "rgba(149,156,145,0.35)"}`, background: selected ? "rgba(211,247,122,0.11)" : "rgba(16,18,17,0.35)", color: textColor, padding: "11px 12px", display: "flex", gap: 10, cursor: "pointer" }}><span style={{ color: selected ? accentColor : mutedColor, minWidth: 18 }}>{choice}</span><span>{label}</span></button>
        ) })}
       </div>
       {showChoiceReflection && (<div style={{ marginTop: 14, border: "1px solid rgba(211,247,122,0.35)", background: "rgba(211,247,122,0.08)", borderRadius: 12, padding: "11px 12px", transition: reducedMotion ? "none" : "opacity 180ms ease" }}><p style={{ margin: 0, color: textColor }}>{chosenReflection}</p></div>)}
       <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={handleBack} style={{ ...buttonBaseStyle, background: "transparent", border: "1px solid rgba(149,156,145,0.4)", color: textColor, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Back</button>
        <p style={{ margin: 0, color: mutedColor, fontSize: 13 }}>No timer. Take your time.</p>
        <button onClick={handleContinue} disabled={selectedChoice === null} style={{ ...buttonBaseStyle, background: selectedChoice === null ? "rgba(211,247,122,0.2)" : accentColor, color: "#101211", border: "none", borderRadius: 10, padding: "10px 16px", cursor: selectedChoice === null ? "not-allowed" : "pointer", fontWeight: 600, opacity: selectedChoice === null ? 0.6 : 1 }}>{showChoiceReflection ? currentIndex === totalQuestions - 1 ? "Complete" : "Next question" : "Continue"}</button>
       </div>
       <p style={{ margin: "12px 0 0 0", color: mutedColor, fontSize: 12 }}>Exploration points reward showing up, not being right. +10 per answered question.</p>
      </>) : (<>
       <h3 style={{ margin: "0 0 8px 0", fontSize: isTiny ? 24 : 34 }}>{maxPoints} points complete.</h3><p style={{ margin: 0, color: mutedColor }}>{summary.narrative}</p>
       <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}><button onClick={() => startTransition(() => setShowReflectionDialog(true))} style={{ ...buttonBaseStyle, background: accentColor, color: "#101211", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Review answers</button><button onClick={handleReset} style={{ ...buttonBaseStyle, background: "transparent", color: textColor, border: "1px solid rgba(149,156,145,0.45)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Restart journey</button></div>
      </>)}
     </section>
    </div></main>
   </div>
  </div>
  {(showHowItWorks || showReflectionDialog) && (
   <div role="presentation" onClick={() => startTransition(() => { setShowHowItWorks(false); setShowReflectionDialog(false) })} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={showHowItWorks ? "How it works" : "Your reflection"} onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 760, maxHeight: "85vh", overflowY: "auto", background: surfaceColor, border: "1px solid rgba(149,156,145,0.35)", borderRadius: 14, padding: 16, boxSizing: "border-box" }}>
     {showHowItWorks ? (<>
      <h3 style={{ margin: 0, fontSize: 24 }}>How Inner Orbit works</h3>
      <p style={{ color: mutedColor }}>{totalQuestions} reflective questions across 5 chapters. Every answered question grants 10 exploration points. There are no correct answers, and this is not a personality or intelligence assessment. Your selections generate a summary based on the themes you chose.</p>
      <ul style={{ color: textColor, paddingLeft: 20, marginTop: 8 }}><li>Choose one answer per question.</li><li>Continue to see a short reflection and move forward.</li><li>Use Back to revise earlier answers without duplicate points.</li><li>Progress auto-saves locally on this device.</li></ul>
     </>) : (<>
      <h3 style={{ margin: 0, fontSize: 24 }}>Your reflection</h3><p style={{ color: mutedColor, marginTop: 8 }}>{isComplete ? `Completed: ${points} / ${maxPoints} points.` : `In progress: ${points} points.`} {summary.narrative}</p>
      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>{summary.review.map((item, idx) => (<article key={`${item.prompt}-${idx}`} style={{ border: "1px solid rgba(149,156,145,0.28)", borderRadius: 10, padding: 10 }}><p style={{ margin: 0, color: mutedColor, fontSize: 12 }}>{item.chapter} · {String(idx + 1).padStart(2, "0")}/{totalQuestions}</p><p style={{ margin: "4px 0 4px 0" }}>{item.prompt}</p><p style={{ margin: 0, color: accentColor }}>{item.choice}: {item.optionText}</p><p style={{ margin: "4px 0 0 0", color: mutedColor }}>{item.reflectionText}</p></article>))}</div>
      <div style={{ marginTop: 12 }}><button onClick={handleReset} style={{ ...buttonBaseStyle, background: "transparent", border: "1px solid rgba(149,156,145,0.4)", color: textColor, borderRadius: 10, padding: "9px 12px", cursor: "pointer" }}>Restart with clean slate</button></div>
     </>)}
     <div style={{ marginTop: 14 }}><button onClick={() => startTransition(() => { setShowHowItWorks(false); setShowReflectionDialog(false) })} style={{ ...buttonBaseStyle, background: accentColor, color: "#101211", border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer" }}>Close</button></div>
    </div>
   </div>
  )}
 </div>
 )
}
addPropertyControls(InnerOrbit, {
 title: { type: ControlType.String, defaultValue: "INNER ORBIT" },
 subtitle: { type: ControlType.String, defaultValue: "A little closer to yourself." },
 accentColor: { type: ControlType.Color, defaultValue: "#D3F77A" },
 backgroundColor: { type: ControlType.Color, defaultValue: "#101211" },
 surfaceColor: { type: ControlType.Color, defaultValue: "#191C19" },
 textColor: { type: ControlType.Color, defaultValue: "#F1F2EB" },
 mutedColor: { type: ControlType.Color, defaultValue: "#959C91" },
 font: { type: ControlType.Font, controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "15px", lineHeight: "1.35em", letterSpacing: "-0.01em", variant: "Medium" } },
 questions: { type: ControlType.Array, maxCount: 15, defaultValue: DEFAULT_QUESTIONS, control: { type: ControlType.Object, controls: {
  chapter: { type: ControlType.String, defaultValue: CHAPTER_TITLES[0] },
  prompt: { type: ControlType.String, defaultValue: "Reflective question" },
  scenario: { type: ControlType.String, defaultValue: "Context for reflection." },
  optionA: { type: ControlType.String, defaultValue: "Option A" }, reflectionA: { type: ControlType.String, defaultValue: "Reflection for option A." }, themeA: { type: ControlType.String, defaultValue: "Theme" },
  optionB: { type: ControlType.String, defaultValue: "Option B" }, reflectionB: { type: ControlType.String, defaultValue: "Reflection for option B." }, themeB: { type: ControlType.String, defaultValue: "Theme" },
  optionC: { type: ControlType.String, defaultValue: "Option C" }, reflectionC: { type: ControlType.String, defaultValue: "Reflection for option C." }, themeC: { type: ControlType.String, defaultValue: "Theme" },
  optionD: { type: ControlType.String, defaultValue: "Option D" }, reflectionD: { type: ControlType.String, defaultValue: "Reflection for option D." }, themeD: { type: ControlType.String, defaultValue: "Theme" }
 } } }
})
