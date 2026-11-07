import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import GLPK, { type GLPK as BrowserGLPK } from "glpk.js";
import { registerSW } from "virtual:pwa-register";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  Clock3,
  Flag,
  Goal,
  Info,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RotateCcw,
  Shield,
  Timer,
  Trash2,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  FULL,
  HALF,
  formations,
  formatMinutes,
  formatTime,
  intervalParts,
  matchState,
  minutesSoFar,
  positionLabels,
  segmentAt,
  validateSettings,
  type Game,
  type Plan,
  type Player,
  type Settings,
} from "./domain";
import { createPlan } from "./planner";
import { STORAGE_KEY, freshGame, loadGame, parseGame } from "./storage";

type Tab = "team" | "pitch" | "rotations" | "minutes";
const initial = loadGame();
const playerLabel = (player?: Player) =>
  player ? `${player.nickname} · #${player.number}` : "Sin asignar";
function cumulativeMinutesAtRotations(settings: Settings, plan: Plan) {
  const played = Object.fromEntries(
    settings.players.map((player) => [player.id, 0]),
  );
  return plan.segments.map((slot) => {
    const snapshot = { ...played };
    const duration = slot.end - slot.start;
    for (const id of slot.field) played[id] += duration;
    played[settings.keeperId] += duration;
    return snapshot;
  });
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function App() {
  const [game, setGame] = useState<Game>(initial.game);
  const [notice, setNotice] = useState(initial.notice);
  const [storageError, setStorageError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState<Tab>(initial.game.plan ? "pitch" : "team");
  const [preview, setPreview] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [modal, setModal] = useState<
    "new" | "privacy" | "rules" | "start" | null
  >(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [rosterSession, setRosterSession] = useState(0);
  const solver = useRef<BrowserGLPK | null>(null);
  const generation = useRef(0);
  const { settings, plan, clock } = game;
  const swapInterval = intervalParts(settings.interval);
  const state = matchState(clock, now);
  const locked = clock.firstStartedAt !== null;
  const errors = validateSettings(settings);
  const currentIndex = plan
    ? segmentAt(plan, state.elapsed, state.phase === "halftime")
    : 0;
  const shownIndex = plan
    ? Math.min(preview ?? currentIndex, plan.segments.length - 1)
    : 0;
  const segment = plan?.segments[shownIndex];
  const currentSegment = plan?.segments[currentIndex];
  const nextSegment = plan?.segments[currentIndex + 1];
  const actual = plan ? minutesSoFar(settings, plan, state.elapsed) : {};
  const playedAtRotation = plan
    ? cumulativeMinutesAtRotations(settings, plan)
    : [];
  const phaseLabel = {
    setup: "Antes del partido",
    first: "Primera parte",
    halftime: "Descanso",
    second: "Segunda parte",
    finished: "Partido finalizado",
  }[state.phase];

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [game]);
  useEffect(() => {
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    if (import.meta.env.PROD)
      registerSW({
        onOfflineReady: () => setOfflineReady(true),
        onRegisteredSW: (_url, registration) => {
          if (registration?.active && navigator.serviceWorker.controller)
            setOfflineReady(true);
        },
        onRegisterError: () =>
          setNotice(
            "No se pudo preparar el modo sin conexion. Conserva la conexion para recargar.",
          ),
      });
    const synchronize = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        generation.current++;
        solver.current?.terminate();
        solver.current = null;
        setBusy(false);
        setPreview(null);
        setGame(event.newValue ? parseGame(event.newValue) : freshGame());
        setNotice("Partido actualizado desde otra pestana de este navegador.");
      } catch {
        setNotice("No se pudieron leer los cambios de otra pestana.");
      }
    };
    window.addEventListener("storage", synchronize);
    return () => {
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("storage", synchronize);
    };
  }, []);

  function updateSettings(next: Settings) {
    if (locked) return;
    generation.current++;
    solver.current?.terminate();
    solver.current = null;
    setBusy(false);
    setError("");
    setPreview(null);
    setGame((previous) => ({ ...previous, settings: next, plan: null }));
  }
  function updateInterval(part: "minutes" | "seconds", value: string) {
    const amount = Number(value);
    if (
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      (part === "seconds" && amount > 59)
    ) {
      setError(
        part === "seconds"
          ? "Los segundos deben ser un entero entre 0 y 59."
          : "Los minutos deben ser un entero positivo o cero.",
      );
      return;
    }
    const minutes = part === "minutes" ? amount : swapInterval.minutes;
    const seconds = part === "seconds" ? amount : swapInterval.seconds;
    updateSettings({ ...settings, interval: (minutes * 60 + seconds) / 60 });
  }
  async function calculate() {
    setShowErrors(true);
    if (errors.length || locked) return;
    const request = ++generation.current;
    setBusy(true);
    setError("");
    let activeSolver: BrowserGLPK | null = null;
    try {
      activeSolver = await GLPK();
      if (generation.current !== request) {
        activeSolver.terminate();
        return;
      }
      solver.current = activeSolver;
      const calculated = await createPlan(settings, activeSolver);
      if (generation.current === request) {
        setGame((previous) => ({ ...previous, plan: calculated }));
        setPreview(null);
        setTab("pitch");
      }
    } catch (reason) {
      if (generation.current === request)
        setError(
          reason instanceof Error
            ? reason.message
            : "No se pudo calcular el plan. Intentalo de nuevo.",
        );
    } finally {
      activeSolver?.terminate();
      if (generation.current === request) {
        setBusy(false);
        solver.current = null;
      }
    }
  }
  function cancelCalculation() {
    generation.current++;
    solver.current?.terminate();
    solver.current = null;
    setBusy(false);
  }
  function startHalf() {
    setGame((previous) => {
      if (!previous.plan) return previous;
      const current = matchState(previous.clock, Date.now());
      if (current.phase === "setup")
        return {
          ...previous,
          clock: { firstStartedAt: Date.now(), secondStartedAt: null },
        };
      if (current.phase === "halftime")
        return {
          ...previous,
          clock: { ...previous.clock, secondStartedAt: Date.now() },
        };
      return previous;
    });
    setNow(Date.now());
    setPreview(null);
    setTab("pitch");
    setModal(null);
  }
  function newGame() {
    cancelCalculation();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      setStorageError(true);
    }
    setGame(freshGame());
    setRosterSession((value) => value + 1);
    setModal(null);
    setPreview(null);
    setShowErrors(false);
    setError("");
    setNotice("");
    setTab("team");
  }
  const getPlayer = (id: string) =>
    settings.players.find((player) => player.id === id);
  const nextIncoming =
    nextSegment?.field.filter((id) => !currentSegment?.field.includes(id)) ??
    [];
  const nextOutgoing =
    currentSegment?.field.filter(
      (id) => nextSegment && !nextSegment.field.includes(id),
    ) ?? [];

  return (
    <>
      <a className="skip-link" href="#workspace">
        Saltar al partido
      </a>
      <header className="app-header">
        <a
          href="#"
          className="brand"
          aria-label="Cancha Justa, inicio"
          onClick={(event) => {
            event.preventDefault();
            setTab("pitch");
          }}
        >
          <span className="brand-icon">
            <Goal size={27} strokeWidth={1.7} />
          </span>
          <span>
            CANCHA
            <span className="brand-second">
              JUSTA<span className="brand-dot">.</span>
            </span>
          </span>
        </a>
        <div className="header-divider" />
        <span className="header-subtitle">FÚTBOL BASE</span>
        <div className="header-actions">
          <span
            className={`connection ${!online ? "is-offline" : ""}`}
            title={
              offlineReady
                ? "Preparado para recargar sin conexion"
                : "El modo sin conexion se prepara al cargar la version de produccion"
            }
          >
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            <span>
              {!online
                ? "Sin conexión"
                : offlineReady
                  ? "Disponible sin conexión"
                  : "En línea"}
            </span>
          </span>
          <button
            className="button subtle small"
            onClick={() => setModal("new")}
          >
            <Plus size={17} />
            <span>Nuevo partido</span>
          </button>
          <button
            className="icon-button help-button"
            title="Reglas del partido"
            aria-label="Reglas del partido"
            onClick={() => setModal("rules")}
          >
            <CircleHelp size={20} />
          </button>
        </div>
      </header>

      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> TU EQUIPO. CADA MINUTO CUENTA.
          </div>
          <h1>
            Partido de hoy<span className="heading-dot">.</span>
          </h1>
          <p>
            Fútbol 6 <span>·</span> 2 partes de 25 min <span>·</span>{" "}
            {settings.players.length} convocados
          </p>
        </div>
        <div className="match-badge">
          <Flag size={19} />
          <div>
            <strong>
              50<span> MIN</span>
            </strong>
            <span>TIEMPO DE JUEGO</span>
          </div>
        </div>
      </div>

      <div className="notices" aria-live="polite">
        {notice && (
          <div className="notice">
            <Info size={17} />
            <span>{notice}</span>
            <button
              className="icon-button"
              title="Descartar aviso"
              aria-label="Descartar aviso"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {storageError && (
          <div className="notice warning">
            <Info size={17} />
            <span>
              No se pueden guardar los datos en este navegador. No cierres ni
              recargues el partido.
            </span>
          </div>
        )}
        {clock.firstStartedAt !== null &&
          now < (clock.secondStartedAt ?? clock.firstStartedAt) && (
            <div className="notice warning">
              <Clock3 size={17} />
              <span>
                La hora del dispositivo ha retrocedido. Corrige el reloj para
                recuperar el tiempo del partido.
              </span>
            </div>
          )}
      </div>

      <main id="workspace" className="workspace">
        <aside
          className={`setup-panel ${tab === "team" ? "mobile-visible" : ""}`}
          aria-label="Configuracion del partido"
        >
          <div className="section-heading">
            <h2>
              <Users size={18} /> Convocatoria
            </h2>
            <span className="count-badge">{settings.players.length}</span>
          </div>
          <Roster
            key={rosterSession}
            settings={settings}
            locked={locked}
            update={updateSettings}
          />
          <div className="setup-section">
            <h2>
              <ClipboardList size={17} /> Plan de partido{" "}
              {locked && <LockKeyhole size={14} />}
            </h2>
            <label className="field-label" htmlFor="keeper">
              Portero <span>Todo el partido</span>
            </label>
            <select
              id="keeper"
              value={settings.keeperId}
              disabled={locked}
              onChange={(event) =>
                updateSettings({ ...settings, keeperId: event.target.value })
              }
            >
              <option value="">Seleccionar portero</option>
              {settings.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {playerLabel(player)}
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="formation">
              Formación
            </label>
            <select
              id="formation"
              value={settings.formation}
              disabled={locked}
              onChange={(event) =>
                updateSettings({
                  ...settings,
                  formation: event.target.value as Settings["formation"],
                })
              }
            >
              {formations.map((formation) => (
                <option key={formation}>{formation}</option>
              ))}
            </select>
            <div className="settings-pair">
              <div
                className="interval-control"
                role="group"
                aria-labelledby="interval-label"
              >
                <div id="interval-label" className="field-label">
                  Intervalo de cambios
                </div>
                <div className="interval-inputs">
                  <div>
                    <label className="sr-only" htmlFor="interval-minutes">
                      Minutos del intervalo
                    </label>
                    <input
                      id="interval-minutes"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={swapInterval.minutes}
                      disabled={locked}
                      onChange={(event) =>
                        updateInterval("minutes", event.target.value)
                      }
                    />
                    <span aria-hidden="true">min</span>
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="interval-seconds">
                      Segundos del intervalo
                    </label>
                    <input
                      id="interval-seconds"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      inputMode="numeric"
                      value={swapInterval.seconds}
                      disabled={locked}
                      onChange={(event) =>
                        updateInterval("seconds", event.target.value)
                      }
                    />
                    <span aria-hidden="true">s</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="swaps">
                  Cambios <span>por ronda</span>
                </label>
                <input
                  id="swaps"
                  type="number"
                  min={settings.players.length > 6 ? 1 : 0}
                  max={Math.min(5, Math.max(0, settings.players.length - 6))}
                  step="1"
                  inputMode="numeric"
                  value={settings.swaps}
                  disabled={locked}
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      swaps: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          {!locked && (
            <div className="calculate-area">
              {showErrors && errors.length > 0 && (
                <ul className="validation-errors" role="alert">
                  {errors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="validation-errors" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button primary calculate-button"
                onClick={calculate}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <ArrowLeftRight size={18} />
                )}
                {busy
                  ? "Buscando el mejor reparto…"
                  : plan
                    ? "Recalcular rotaciones"
                    : "Calcular rotaciones"}
                {!busy && <ArrowRight size={17} />}
              </button>
              {busy && (
                <button
                  className="button subtle cancel-button"
                  onClick={cancelCalculation}
                >
                  <X size={16} /> Cancelar cálculo
                </button>
              )}
              {plan ? (
                <p className="micro-status">
                  <CircleCheck size={13} /> Plan actualizado
                </p>
              ) : (
                <p className="micro-status">
                  {settings.players.length === 0
                    ? "Sin convocatoria"
                    : "Pendiente de cálculo"}
                </p>
              )}
            </div>
          )}
          {locked && (
            <div className="locked-note">
              <LockKeyhole size={15} /> Configuración cerrada al iniciar
            </div>
          )}
          <button className="privacy-link" onClick={() => setModal("privacy")}>
            <Shield size={14} /> Solo en este dispositivo{" "}
            <ChevronRight size={14} />
          </button>
        </aside>

        <section
          className={`match-area ${tab === "team" ? "mobile-hidden" : ""}`}
          aria-label="Partido"
        >
          <div className="match-topbar">
            <nav className="view-tabs" aria-label="Vistas del partido">
              {(
                [
                  { id: "pitch", label: "Pizarra", icon: Goal },
                  {
                    id: "rotations",
                    label: "Rotaciones",
                    icon: ArrowLeftRight,
                  },
                  { id: "minutes", label: "Minutos", icon: Timer },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  className={
                    tab === item.id || (tab === "team" && item.id === "pitch")
                      ? "active"
                      : ""
                  }
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? "page" : undefined}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>
            <span className="formation-label">{settings.formation}</span>
          </div>
          <div className="clock-strip">
            <span
              className={`phase-pill ${state.phase === "first" || state.phase === "second" ? "running" : ""}`}
            >
              <span />
              {phaseLabel}
            </span>
            <div className="score-clock">
              <Clock3 size={18} />
              <strong aria-label="Reloj de la parte">
                {formatTime(state.halfElapsed)}
              </strong>
              <span>/ 25:00</span>
            </div>
            {state.phase === "setup" ? (
              <button
                className="button primary small"
                disabled={!plan || busy}
                onClick={() => setModal("start")}
              >
                <Flag size={15} /> Iniciar partido
              </button>
            ) : state.phase === "halftime" ? (
              <button className="button primary small" onClick={startHalf}>
                <Flag size={15} /> Iniciar 2ª parte
              </button>
            ) : (
              <span className="clock-status">
                {state.phase === "finished" ? (
                  <>
                    <Check size={16} /> Final
                  </>
                ) : (
                  <>
                    <span className="live-dot" /> En juego
                  </>
                )}
              </span>
            )}
          </div>

          {(tab === "pitch" || tab === "team") && (
            <div className="pitch-layout">
              <div className="pitch-column">
                <div className="pitch-heading">
                  <h2>
                    {preview === null
                      ? "Sobre el campo"
                      : `Alineación · ${formatTime(segment?.start ?? 0)}`}
                  </h2>
                  <span>
                    {preview !== null
                      ? "VISTA DEL PLAN"
                      : locked
                        ? "ALINEACIÓN ESTIMADA"
                        : "ALINEACIÓN PREVISTA"}
                  </span>
                </div>
                <Pitch settings={settings} segment={segment} />
                <div className="segment-control">
                  <button
                    className="icon-button"
                    disabled={!plan || shownIndex === 0}
                    title="Tramo anterior"
                    aria-label="Tramo anterior"
                    onClick={() => setPreview(shownIndex - 1)}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <strong>
                      {segment
                        ? `${formatTime(segment.start)} — ${formatTime(segment.end)}`
                        : "00:00 — 50:00"}
                    </strong>
                    <span>
                      {plan
                        ? `Tramo ${shownIndex + 1} de ${plan.segments.length}`
                        : "Sin plan calculado"}
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    disabled={
                      !plan || shownIndex === (plan?.segments.length ?? 1) - 1
                    }
                    title="Tramo siguiente"
                    aria-label="Tramo siguiente"
                    onClick={() => setPreview(shownIndex + 1)}
                  >
                    <ChevronRight size={20} />
                  </button>
                  {preview !== null && (
                    <button
                      className="return-live"
                      onClick={() => setPreview(null)}
                    >
                      <RotateCcw size={13} />
                      {locked ? "Volver al directo" : "Ver inicio"}
                    </button>
                  )}
                </div>
                <Bench settings={settings} field={segment?.field} />
              </div>
              <aside className="insights">
                <div className="insight-section">
                  <div className="section-heading">
                    <h2>
                      <ArrowLeftRight size={17} /> Próximo cambio
                    </h2>
                    {nextSegment && (
                      <span className="round-number">{currentIndex + 1}</span>
                    )}
                  </div>
                  {plan && nextSegment ? (
                    <>
                      <div className="next-time">
                        {formatTime(nextSegment.start)}
                        <span>de juego total</span>
                      </div>
                      {state.phase === "halftime" &&
                      nextSegment.start === HALF ? (
                        <p className="next-caption">
                          Al iniciar la segunda parte
                        </p>
                      ) : (
                        <p className="next-caption">
                          {locked
                            ? `En ${formatTime(Math.max(0, nextSegment.start - state.elapsed))}`
                            : `Cada ${formatTime(Math.round(settings.interval * 60))}`}
                        </p>
                      )}
                      <div className="exchange-group incoming">
                        <h3>
                          <ArrowUp size={13} /> ENTRAN
                        </h3>
                        {nextIncoming.map((id) => (
                          <PlayerLine key={id} player={getPlayer(id)} />
                        ))}
                      </div>
                      <div className="exchange-group outgoing">
                        <h3>
                          <ArrowDown size={13} /> DESCANSAN
                        </h3>
                        {nextOutgoing.map((id) => (
                          <PlayerLine key={id} player={getPlayer(id)} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-insight">
                      <ArrowLeftRight size={28} strokeWidth={1.3} />
                      <strong>
                        {plan ? "Sin más cambios" : "Sin rotaciones"}
                      </strong>
                      <span>
                        {plan
                          ? "Alineación hasta el final"
                          : "Pendiente de cálculo"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="insight-section minute-insight">
                  <div className="section-heading">
                    <h2>
                      <Timer size={17} /> Reparto de minutos
                    </h2>
                  </div>
                  <MinuteBars
                    settings={settings}
                    plan={plan}
                    actual={actual}
                    live={locked}
                    compact
                  />
                  {plan && (
                    <button
                      className="text-button"
                      onClick={() => setTab("minutes")}
                    >
                      Ver todo el reparto <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </aside>
            </div>
          )}

          {tab === "rotations" && (
            <section className="full-view">
              <div className="view-heading">
                <div>
                  <h2>Plan de rotaciones</h2>
                  <p>
                    {plan
                      ? `${plan.segments.length - 1} rondas · ${settings.swaps} cambios por ronda`
                      : "Sin plan calculado"}
                  </p>
                </div>
                <ArrowLeftRight size={24} />
              </div>
              {plan ? (
                <>
                  <div className="timeline">
                    {plan.segments.map((slot, index) => {
                      const previous = plan.segments[index - 1];
                      const incoming = previous
                        ? slot.field.filter(
                            (id) => !previous.field.includes(id),
                          )
                        : slot.field;
                      const outgoing =
                        previous?.field.filter(
                          (id) => !slot.field.includes(id),
                        ) ?? [];
                      return (
                        <article
                          className={`timeline-row ${locked && index === currentIndex ? "current" : ""}`}
                          key={slot.start}
                        >
                          <div className="timeline-time">
                            <strong>{formatTime(slot.start)}</strong>
                            <span>
                              {slot.start === 0
                                ? "INICIO"
                                : slot.start === HALF
                                  ? "INICIO 2ª PARTE"
                                  : slot.start < HALF
                                    ? "1ª PARTE"
                                    : "2ª PARTE"}
                            </span>
                          </div>
                          <div className="timeline-changes">
                            <div className="timeline-in">
                              <ArrowUp size={14} />
                              {incoming.map((id) => (
                                <span key={id}>
                                  {playerLabel(getPlayer(id))}
                                </span>
                              ))}
                            </div>
                            {outgoing.length > 0 && (
                              <div className="timeline-out">
                                <ArrowDown size={14} />
                                {outgoing.map((id) => (
                                  <span key={id}>
                                    {playerLabel(getPlayer(id))}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <details className="timeline-minutes">
                            <summary>
                              <Timer size={14} /> Minutos acumulados
                            </summary>
                            <div className="timeline-minute-grid">
                              {settings.players.map((player) => (
                                <div
                                  className="timeline-minute-item"
                                  key={player.id}
                                >
                                  <span>
                                    {playerLabel(player)}
                                    {player.id === settings.keeperId &&
                                      " · Portero"}
                                  </span>
                                  <strong>
                                    {formatMinutes(
                                      playedAtRotation[index][player.id] ?? 0,
                                    )}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </details>
                          <button
                            className="icon-button"
                            title={`Ver alineacion del minuto ${slot.start / 60}`}
                            aria-label={`Ver alineacion del minuto ${slot.start / 60}`}
                            onClick={() => {
                              setPreview(index);
                              setTab("pitch");
                            }}
                          >
                            <Goal size={19} />
                          </button>
                        </article>
                      );
                    })}
                    <div className="timeline-end">
                      <Flag size={15} />
                      <strong>50:00</strong> Final del partido
                    </div>
                  </div>
                  <p className="estimate-note">
                    <Info size={15} /> Rotaciones automáticas. Los cambios
                    reales no se verifican.
                  </p>
                </>
              ) : (
                <EmptyState
                  icon={<ArrowLeftRight size={34} />}
                  label="Sin rotaciones calculadas"
                  action={() => setTab("team")}
                />
              )}
            </section>
          )}

          {tab === "minutes" && (
            <section className="full-view">
              <div className="view-heading">
                <div>
                  <h2>Cada minuto cuenta</h2>
                  <p>
                    {locked
                      ? "Minutos estimados y plan completo"
                      : "Minutos previstos · 50 minutos de juego"}
                  </p>
                </div>
                <Timer size={24} />
              </div>
              {plan ? (
                <>
                  <div className="fairness-summary">
                    <div>
                      <span>Diferencia entre jugadores de campo</span>
                      <strong>{formatMinutes(plan.gap)}</strong>
                    </div>
                    <span className="fairness-check">
                      <CircleCheck size={19} /> Mejor reparto posible
                    </span>
                  </div>
                  <MinuteBars
                    settings={settings}
                    plan={plan}
                    actual={actual}
                    live={locked}
                  />
                  <p className="estimate-note">
                    <Info size={15} /> El portero juega todo el partido y no se
                    incluye en el reparto.{" "}
                    {locked
                      ? "Minutos estimados según el plan; no verificados."
                      : "Quienes siguen en el campo conservan su posición entre cambios."}
                  </p>
                </>
              ) : (
                <EmptyState
                  icon={<Timer size={34} />}
                  label="Sin reparto calculado"
                  action={() => setTab("team")}
                />
              )}
            </section>
          )}

          <div className="match-footer">
            <span>
              <Shield size={13} /> Datos locales · Sin cuentas
            </span>
            <button onClick={() => setModal("rules")}>
              Reglas del partido <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </main>
      <footer className="page-footer">
        <span>
          CANCHA JUSTA<span className="brand-dot">.</span>
        </span>
        <span>Fútbol pequeño. Grandes oportunidades.</span>
      </footer>
      <nav className="mobile-nav" aria-label="Navegacion principal">
        {(
          [
            { id: "team", label: "Equipo", icon: Users },
            { id: "pitch", label: "Pizarra", icon: Goal },
            { id: "rotations", label: "Rotaciones", icon: ArrowLeftRight },
            { id: "minutes", label: "Minutos", icon: Timer },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {modal === "new" && (
        <Modal title="¿Nuevo partido?" onClose={() => setModal(null)}>
          <p>
            Se eliminarán los apodos, dorsales, el plan y el progreso de este
            partido. Esta acción no se puede deshacer.
          </p>
          <div className="dialog-actions">
            <button className="button subtle" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="button danger" onClick={newGame}>
              <Trash2 size={17} /> Borrar y empezar
            </button>
          </div>
        </Modal>
      )}
      {modal === "start" && (
        <Modal title="¿Todo listo para jugar?" onClose={() => setModal(null)}>
          <div className="start-summary">
            <span>
              <Users size={17} />
              {settings.players.length} convocados
            </span>
            <span>
              <Shield size={17} />
              {playerLabel(getPlayer(settings.keeperId))}
            </span>
            <span>
              <Clock3 size={17} />2 partes de 25 minutos
            </span>
          </div>
          <p>
            Al iniciar se cierra la configuración. El reloj corre sin pausa y
            los cambios se aplican automáticamente al plan.
          </p>
          <div className="dialog-actions">
            <button className="button subtle" onClick={() => setModal(null)}>
              Revisar
            </button>
            <button className="button primary" onClick={startHalf}>
              <Flag size={17} /> Empezar primera parte
            </button>
          </div>
        </Modal>
      )}
      {modal === "privacy" && (
        <Modal title="Solo en este dispositivo" onClose={() => setModal(null)}>
          <p>
            Los apodos, dorsales y el partido se guardan únicamente en este
            navegador. No se envían a un servidor ni hay cuentas, historial o
            sincronización.
          </p>
          <p>
            El partido permanece después del final hasta que elijas «Nuevo
            partido». Otras personas que usen este navegador pueden acceder a
            él.
          </p>
          <p>
            El modo privado, borrar los datos del navegador o la limpieza de
            almacenamiento pueden impedir la recuperación.
          </p>
          <button className="button primary" onClick={() => setModal(null)}>
            <Check size={17} /> Entendido
          </button>
        </Modal>
      )}
      {modal === "rules" && (
        <Modal title="Reglas del partido" onClose={() => setModal(null)}>
          <ul className="rules-list">
            <li>
              <Goal size={18} />
              <span>
                5 jugadores de campo y un portero fijo. El portero queda fuera
                del equilibrio de minutos.
              </span>
            </li>
            <li>
              <Clock3 size={18} />
              <span>
                Dos partes de 25 minutos, sin pausa durante cada parte. La
                segunda parte se inicia manualmente.
              </span>
            </li>
            <li>
              <ArrowLeftRight size={18} />
              <span>
                El intervalo sigue contando entre partes, sin incluir el
                descanso. Un cambio previsto en el descanso se aplica al iniciar
                la segunda parte.
              </span>
            </li>
            <li>
              <Trophy size={18} />
              <span>
                Se minimiza la diferencia de minutos con el intervalo y el
                número exacto de cambios elegidos. Quienes siguen en el campo
                conservan su posición. Los que entran ocupan los puestos libres.
              </span>
            </li>
            <li>
              <Info size={18} />
              <span>
                Los minutos en directo son estimaciones. El navegador no
                verifica los cambios reales ni garantiza avisos cuando está
                cerrado.
              </span>
            </li>
          </ul>
          <button className="button primary" onClick={() => setModal(null)}>
            <Check size={17} /> Entendido
          </button>
        </Modal>
      )}
    </>
  );
}

function Roster({
  settings,
  locked,
  update,
}: {
  settings: Settings;
  locked: boolean;
  update: (settings: Settings) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [number, setNumber] = useState("");
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nickname.trim() || !number.trim() || locked) return;
    const players = [
      ...settings.players,
      {
        id: crypto.randomUUID(),
        nickname: nickname.trim(),
        number: number.trim(),
      },
    ];
    update({
      ...settings,
      players,
      swaps:
        players.length <= 6
          ? 0
          : settings.swaps || Math.min(2, players.length - 6),
    });
    setNickname("");
    setNumber("");
    event.currentTarget.querySelector<HTMLInputElement>("#nickname")?.focus();
  }
  return (
    <>
      <div className="roster-list">
        {settings.players.length === 0 ? (
          <div className="roster-empty">
            <Users size={27} strokeWidth={1.3} />
            <span>Sin jugadores</span>
            <span className="roster-empty-count">0 / 6 mínimo</span>
          </div>
        ) : (
          settings.players.map((player) => (
            <div className="roster-row" key={player.id}>
              <span
                className={`jersey-number ${settings.keeperId === player.id ? "keeper-number" : ""}`}
              >
                {player.number}
              </span>
              <input
                aria-label={`Apodo del dorsal ${player.number}`}
                value={player.nickname}
                disabled={locked}
                maxLength={24}
                onChange={(event) =>
                  update({
                    ...settings,
                    players: settings.players.map((other) =>
                      other.id === player.id
                        ? { ...other, nickname: event.target.value }
                        : other,
                    ),
                  })
                }
              />
              <input
                className="editable-number"
                aria-label={`Dorsal de ${player.nickname}`}
                value={player.number}
                disabled={locked}
                maxLength={3}
                inputMode="numeric"
                onChange={(event) =>
                  update({
                    ...settings,
                    players: settings.players.map((other) =>
                      other.id === player.id
                        ? { ...other, number: event.target.value }
                        : other,
                    ),
                  })
                }
              />
              {settings.keeperId === player.id && (
                <Shield
                  size={13}
                  className="keeper-mark"
                  aria-label="Portero"
                />
              )}
              {!locked && (
                <button
                  className="icon-button remove-player"
                  title={`Quitar a ${player.nickname}`}
                  aria-label={`Quitar a ${player.nickname}`}
                  onClick={() => {
                    const players = settings.players.filter(
                      (other) => other.id !== player.id,
                    );
                    const maximum = Math.min(
                      5,
                      Math.max(0, players.length - 6),
                    );
                    update({
                      ...settings,
                      players,
                      keeperId:
                        settings.keeperId === player.id
                          ? ""
                          : settings.keeperId,
                      swaps: Math.min(settings.swaps, maximum),
                    });
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {!locked && (
        <form className="add-player" onSubmit={add}>
          <div>
            <label className="sr-only" htmlFor="nickname">
              Apodo
            </label>
            <input
              id="nickname"
              placeholder="Apodo"
              value={nickname}
              maxLength={24}
              required
              autoComplete="off"
              onChange={(event) => setNickname(event.target.value)}
            />
            <label className="sr-only" htmlFor="shirt-number">
              Dorsal
            </label>
            <input
              id="shirt-number"
              placeholder="Nº"
              value={number}
              maxLength={3}
              required
              inputMode="numeric"
              autoComplete="off"
              onChange={(event) => setNumber(event.target.value)}
            />
            <button
              className="icon-button add-button"
              type="submit"
              title="Añadir jugador"
              aria-label="Añadir jugador"
            >
              <Plus size={21} />
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function Pitch({
  settings,
  segment,
}: {
  settings: Settings;
  segment?: Plan["segments"][number];
}) {
  const positions = positionLabels(settings.formation);
  const players = settings.players;
  const [defenders, midfielders, forwards] = settings.formation
    .split("-")
    .map(Number);
  const rows = [forwards, midfielders, defenders];
  const offsets = [defenders + midfielders, defenders, 0];
  const keeper = players.find((player) => player.id === settings.keeperId);
  return (
    <div
      className="pitch"
      role="group"
      aria-label={`Campo con formacion ${settings.formation}`}
    >
      <div className="pitch-markings" aria-hidden="true">
        <div className="halfway" />
        <div className="center-circle" />
        <div className="center-spot" />
        <div className="penalty top" />
        <div className="penalty bottom" />
        <div className="six-yard top" />
        <div className="six-yard bottom" />
        <div className="goal top" />
        <div className="goal bottom" />
        <div className="penalty-spot top" />
        <div className="penalty-spot bottom" />
      </div>
      <span className="attack-direction" aria-hidden="true">
        <ArrowUp size={12} /> ATAQUE
      </span>
      <div className="pitch-players">
        {rows.map((count, row) => (
          <div className="pitch-row" key={row}>
            {Array.from({ length: count }, (_, column) => {
              const position = offsets[row] + column;
              const player = players.find(
                (child) => child.id === segment?.field[position],
              );
              return (
                <PitchPlayer
                  key={position}
                  player={player}
                  label={positions[position]}
                />
              );
            })}
          </div>
        ))}
        <div className="pitch-row keeper-row">
          <PitchPlayer player={keeper} label="Portero" keeper />
        </div>
      </div>
      <span className="pitch-watermark" aria-hidden="true">
        CANCHA JUSTA
      </span>
    </div>
  );
}
function PitchPlayer({
  player,
  label,
  keeper = false,
}: {
  player?: Player;
  label: string;
  keeper?: boolean;
}) {
  return (
    <div
      className={`pitch-player ${keeper ? "is-keeper" : ""} ${!player ? "unassigned" : ""}`}
      aria-label={`${label}: ${playerLabel(player)}`}
    >
      <span className="player-token">
        {player?.number || (keeper ? <Shield size={19} /> : "—")}
      </span>
      <strong title={player?.nickname}>
        {player?.nickname || "Sin asignar"}
      </strong>
      <span className="position-label">{label}</span>
    </div>
  );
}
function Bench({ settings, field }: { settings: Settings; field?: string[] }) {
  const bench = field
    ? settings.players.filter(
        (player) =>
          player.id !== settings.keeperId && !field.includes(player.id),
      )
    : [];
  return (
    <section className="bench">
      <div className="section-heading">
        <h2>
          <Users size={16} /> Banquillo
        </h2>
        <span className="count-badge">{bench.length}</span>
      </div>
      <div className="bench-players">
        {bench.length ? (
          bench.map((player) => <PlayerLine key={player.id} player={player} />)
        ) : (
          <span className="muted">
            {field ? "Todos sobre el campo" : "Sin plan calculado"}
          </span>
        )}
      </div>
    </section>
  );
}
function PlayerLine({ player }: { player?: Player }) {
  return (
    <span className="player-line">
      <span className="jersey-number">{player?.number ?? "—"}</span>
      <span>{player?.nickname ?? "Sin asignar"}</span>
    </span>
  );
}
function MinuteBars({
  settings,
  plan,
  actual,
  live,
  compact = false,
}: {
  settings: Settings;
  plan: Plan | null;
  actual: Record<string, number>;
  live: boolean;
  compact?: boolean;
}) {
  if (!plan)
    return (
      <div className="empty-minutes">
        <div />
        <div />
        <div />
        <span>Sin minutos calculados</span>
      </div>
    );
  const fields = settings.players.filter(
    (player) => player.id !== settings.keeperId,
  );
  const keeper = settings.players.find(
    (player) => player.id === settings.keeperId,
  );
  const ordered = compact
    ? fields.slice(0, 5)
    : [...fields, ...(keeper ? [keeper] : [])];
  return (
    <div className={`minute-bars ${compact ? "compact" : ""}`}>
      {ordered.map((player) => (
        <div
          className={`minute-row ${player.id === settings.keeperId ? "keeper-minutes" : ""}`}
          key={player.id}
        >
          <div className="minute-player">
            <PlayerLine player={player} />
            {player.id === settings.keeperId && (
              <span className="keeper-tag">Portero</span>
            )}
            <strong>
              {live ? (
                <>
                  <span>{formatMinutes(actual[player.id] ?? 0)}</span>
                  <span className="planned-total">
                    {" "}
                    / {formatMinutes(plan.totals[player.id])}
                  </span>
                </>
              ) : (
                formatMinutes(plan.totals[player.id])
              )}
            </strong>
          </div>
          <div className="minute-track">
            <span
              className="planned-bar"
              style={{ width: `${(plan.totals[player.id] / FULL) * 100}%` }}
            />
            {live && (
              <span
                className="elapsed-bar"
                style={{ width: `${((actual[player.id] ?? 0) / FULL) * 100}%` }}
              />
            )}
          </div>
        </div>
      ))}
      {compact && (
        <div className="gap-caption">
          <span>Diferencia en campo</span>
          <strong>{formatMinutes(plan.gap)}</strong>
        </div>
      )}
      {live && !compact && (
        <div className="bar-legend">
          <span>
            <i /> Estimados
          </span>
          <span>
            <i /> Plan completo
          </span>
        </div>
      )}
    </div>
  );
}
function EmptyState({
  icon,
  label,
  action,
}: {
  icon: ReactNode;
  label: string;
  action: () => void;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{label}</h3>
      <button className="button subtle" onClick={action}>
        <Users size={17} /> Ver convocatoria
      </button>
    </div>
  );
}
