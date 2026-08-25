"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import styles from "./Etho.module.css";
import EthoBootScreen from "./components/EthoBootScreen";
import EthoTerminalView from "./components/EthoTerminalView";
import { ErrorScene, FinalScene, PhotosensitivityWarning } from "./components/EthoScenes";
import { createDistortionCurve, ERROR_MESSAGES, FAULT_MESSAGES, INTRO, PROCEED_LINES, PROCEED_PROMPTS, ROUTE_COMMANDS } from "./ethoData";
import type { BootState, DvdPosition, ErrorWindow, ProceedChoice, TerminalLine, RouteCommand } from "./ethoTypes";

export default function Etho() {
  const [bootState, setBootState] = useState<BootState>("boot");
  const [bootLoadingText, setBootLoadingText] = useState("INSERT DISC");
  const [bootAudioError, setBootAudioError] = useState(false);
  const [dvdPosition, setDvdPosition] = useState<DvdPosition>({ x: 0, y: 100 });
  const [dvdVelocity, setDvdVelocity] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [warningOpen, setWarningOpen] = useState(true);
  const [history, setHistory] = useState<TerminalLine[]>([INTRO]);
  const [liveOutput, setLiveOutput] = useState("");
  const [typing, setTyping] = useState(false);
  const [routeStage, setRouteStage] = useState(0);
  const [proceedCount, setProceedCount] = useState(0);
  const [whiteoutLevel, setWhiteoutLevel] = useState(0);
  const [proceedMenuOpen, setProceedMenuOpen] = useState(false);
  const [proceedChoice, setProceedChoice] = useState<ProceedChoice>("proceed");
  const [finalScene, setFinalScene] = useState(false);
  const [dessMode, setDessMode] = useState(false);
  const [faultMode, setFaultMode] = useState(false);
  const [errorWindows, setErrorWindows] = useState<ErrorWindow[]>([]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextLineId = useRef(1);
  const whiteoutLevelRef = useRef(0);
  const musicWasPlayingBeforeProceed = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proceedGraceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proceedFadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const faultStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faultReappearTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextErrorId = useRef(0);

  const dvdVelocityRef = useRef({ x: 0, y: 0 });
  const dvdFrameRef = useRef<number | null>(null);
  const dvdDragging = useRef(false);
  const dvdPointerOffset = useRef({ x: 0, y: 0 });
  const dvdSleeping = useRef(false);
  const dvdBounces = useRef(0);
  const dvdSlotRef = useRef<HTMLDivElement | null>(null);

  const hddAudio = useRef<HTMLAudioElement | null>(null);
  const jingle = useRef<HTMLAudioElement | null>(null);
  const music = useRef<HTMLAudioElement | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const musicDistortion = useRef<WaveShaperNode | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const dryGain = useRef<GainNode | null>(null);
  const wetGain = useRef<GainNode | null>(null);
  const musicDelay = useRef<DelayNode | null>(null);
  const jingleSource = useRef<MediaElementAudioSourceNode | null>(null);
  const jingleDistortion = useRef<WaveShaperNode | null>(null);
  const jingleFilter = useRef<BiquadFilterNode | null>(null);
  const jingleGain = useRef<GainNode | null>(null);

  const stopDvdPhysics = () => {
    if (dvdFrameRef.current !== null) {
      cancelAnimationFrame(dvdFrameRef.current);
      dvdFrameRef.current = null;
    }
  };

  const startDvdPhysics = () => {
    stopDvdPhysics();
    dvdSleeping.current = false;
    dvdVelocityRef.current = dvdVelocity;
    const tick = () => {
      if (dvdDragging.current || bootState !== "boot") {
        dvdFrameRef.current = null;
        return;
      }
      setDvdPosition((current) => {
        const width = 150;
        const height = 150;
        const floor = Math.max(0, window.innerHeight - height - 24);
        const leftWall = 12;
        const rightWall = Math.max(leftWall, window.innerWidth - width - 12);
        const dt = 1 / 60;
        const gravity = 1650;
        const airResistance = 0.996;
        const restitution = 0.48;
        let vx = dvdVelocityRef.current.x;
        let vy = dvdVelocityRef.current.y;
        vy += gravity * dt;
        vx *= airResistance;
        let x = current.x + vx * dt;
        let y = current.y + vy * dt;
        if (x <= leftWall) { x = leftWall; vx = Math.abs(vx) * restitution; }
        if (x >= rightWall) { x = rightWall; vx = -Math.abs(vx) * restitution; }
        if (y >= floor) {
          y = floor;
          dvdBounces.current += 1;
          vy = -Math.abs(vy) * restitution;
          if (Math.abs(vy) < 55 || dvdBounces.current > 8) {
            vy = 0;
            vx *= 0.88;
            dvdSleeping.current = true;
          }
        }
        dvdVelocityRef.current = { x: vx, y: vy };
        setDvdVelocity({ x: vx, y: vy });
        if (dvdSleeping.current) stopDvdPhysics();
        return { x, y };
      });
      if (!dvdSleeping.current && !dvdDragging.current) dvdFrameRef.current = requestAnimationFrame(tick);
    };
    dvdFrameRef.current = requestAnimationFrame(tick);
  };

  const beginDvdDrop = () => {
    dvdSleeping.current = false;
    dvdBounces.current = 0;
    dvdVelocityRef.current = { x: 0, y: 0 };
    setDvdVelocity({ x: 0, y: 0 });
    startDvdPhysics();
  };

  const insertDvd = () => {
    if (bootState !== "boot" || dvdDragging.current) return;
    const slotRect = dvdSlotRef.current?.getBoundingClientRect();
    const dvdCenterX = dvdPosition.x + 75;
    const dvdBottom = dvdPosition.y + 150;
    if (slotRect) {
      const slotCenterX = slotRect.left + slotRect.width / 2;
      const closeEnough = Math.abs(dvdCenterX - slotCenterX) < 180 && dvdBottom > slotRect.top - 100 && dvdPosition.y < slotRect.bottom + 60;
      if (!closeEnough) return;
    }
    stopDvdPhysics();
    dvdDragging.current = false;
    setBootState("loading");
    setBootLoadingText("INSERTING DISC...");
    if (slotRect) setDvdPosition({ x: slotRect.left + slotRect.width / 2 - 75, y: slotRect.top - 44 });
    window.setTimeout(() => {
      setBootLoadingText("READING HDD...");
      const audio = hddAudio.current;
      if (!audio) { setBootAudioError(true); return; }
      audio.currentTime = 0;
      void audio.play().catch(() => setBootAudioError(true));
    }, 180);
  };

  const retryBootAudio = () => {
    setBootAudioError(false);
    setBootLoadingText("READING HDD...");
    const audio = hddAudio.current;
    if (!audio) { setBootAudioError(true); return; }
    audio.currentTime = 0;
    void audio.play().catch(() => setBootAudioError(true));
  };

  const handleDvdPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (bootState !== "boot") return;
    dvdDragging.current = true;
    dvdSleeping.current = false;
    stopDvdPhysics();
    const rect = event.currentTarget.getBoundingClientRect();
    dvdPointerOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDvdPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dvdDragging.current || bootState !== "boot") return;
    setDvdPosition({ x: event.clientX - dvdPointerOffset.current.x, y: event.clientY - dvdPointerOffset.current.y });
    dvdVelocityRef.current = { x: 0, y: 0 };
    setDvdVelocity({ x: 0, y: 0 });
  };

  const handleDvdPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dvdDragging.current) return;
    dvdDragging.current = false;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Pointer capture may already be released. */ }
    const rect = event.currentTarget.getBoundingClientRect();
    const slotRect = dvdSlotRef.current?.getBoundingClientRect();
    if (slotRect) {
      const dvdCenterX = rect.left + rect.width / 2;
      const closeEnough = Math.abs(dvdCenterX - (slotRect.left + slotRect.width / 2)) < 180 && rect.bottom > slotRect.top - 90 && rect.top < slotRect.bottom + 40;
      if (closeEnough) { insertDvd(); return; }
    }
    dvdVelocityRef.current = { x: 0, y: 60 };
    setDvdVelocity({ x: 0, y: 60 });
    startDvdPhysics();
  };

  const addLine = (kind: TerminalLine["kind"], text: string) => {
    setHistory((current) => [...current, { id: nextLineId.current++, kind, text }]);
  };

  useEffect(() => {
    hddAudio.current = new Audio("/HDD.mp3");
    hddAudio.current.preload = "auto";
    const handleEnded = () => {
      setBootLoadingText("COMPLETE.");
      setBootState("terminal");
      setBootAudioError(false);
      addLine("warning", "[ HDD AUDIO COMPLETE // ECHO TERMINAL READY ]");
    };
    const handleError = () => setBootAudioError(true);
    hddAudio.current.addEventListener("ended", handleEnded);
    hddAudio.current.addEventListener("error", handleError);
    return () => {
      hddAudio.current?.pause();
      if (hddAudio.current) {
        hddAudio.current.currentTime = 0;
        hddAudio.current.removeEventListener("ended", handleEnded);
        hddAudio.current.removeEventListener("error", handleError);
      }
    };
  }, []);

  useEffect(() => {
    jingle.current = new Audio("/weird-route-jingle.mp3");
    music.current = new Audio("/glacier.ogg");
    music.current.loop = true;
    music.current.crossOrigin = "anonymous";
    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
      if (errorTimer.current) clearInterval(errorTimer.current);
      if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
      if (proceedGraceTimer.current) clearTimeout(proceedGraceTimer.current);
      if (proceedFadeTimer.current) clearInterval(proceedFadeTimer.current);
      if (faultStartTimer.current) clearTimeout(faultStartTimer.current);
      faultReappearTimers.current.forEach((timer) => clearTimeout(timer));
      jingle.current?.pause();
      if (jingle.current) jingle.current.currentTime = 0;
      music.current?.pause();
      if (music.current) music.current.currentTime = 0;
      if (audioContext.current && audioContext.current.state !== "closed") void audioContext.current.close();
    };
  }, []);

  useEffect(() => {
    if (bootState !== "boot") return;
    const width = 150;
    const initialX = Math.max(12, Math.min(window.innerWidth / 2 - width / 2, window.innerWidth - width - 12));
    setDvdPosition({ x: initialX, y: 90 });
    setDvdVelocity({ x: 0, y: 0 });
    dvdVelocityRef.current = { x: 0, y: 0 };
    dvdSleeping.current = false;
    dvdBounces.current = 0;
    const timer = window.setTimeout(beginDvdDrop, 400);
    return () => { window.clearTimeout(timer); stopDvdPhysics(); };
  }, [bootState]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [history, liveOutput]);

  useEffect(() => {
    if (!warningOpen && !typing && !dessMode && !proceedMenuOpen && !finalScene) inputRef.current?.focus();
  }, [warningOpen, typing, dessMode, proceedMenuOpen, finalScene]);

  const typeText = (text: string, options: Pick<RouteCommand, "playJingle"> = {}) => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    setLiveOutput("");
    setTyping(true);
    let index = 0;
    typingTimer.current = setInterval(() => {
      index += 1;
      setLiveOutput(text.slice(0, index));
      if (index < text.length) return;
      if (typingTimer.current) clearInterval(typingTimer.current);
      typingTimer.current = null;
      setTyping(false);
      setLiveOutput("");
      addLine("response", text);
      if (options.playJingle && jingle.current) {
        jingle.current.currentTime = 0;
        void jingle.current.play().catch(() => undefined);
      }
    }, 28);
  };

  const startNormalMusic = () => {
    if (!music.current) return;
    if (audioContext.current?.state === "suspended") void audioContext.current.resume();
    if (dryGain.current) dryGain.current.gain.value = 1;
    if (wetGain.current) wetGain.current.gain.value = 0;
    if (masterGain.current) masterGain.current.gain.value = 1;
    if (musicDelay.current) musicDelay.current.delayTime.value = 0;
    if (musicDistortion.current) musicDistortion.current.curve = null;
    music.current.playbackRate = 1;
    music.current.currentTime = 0;
    void music.current.play().catch(() => undefined);
  };

  const makeMusicUnsettling = (intensity = 1) => {
    if (!music.current) return;
    try {
      if (!audioContext.current) {
        const context = new AudioContext();
        const source = context.createMediaElementSource(music.current);
        const distortion = context.createWaveShaper();
        const master = context.createGain();
        const dry = context.createGain();
        const wet = context.createGain();
        const delay = context.createDelay(4);
        const reverb = context.createConvolver();
        const duration = 2.6;
        const impulse = context.createBuffer(2, Math.floor(context.sampleRate * duration), context.sampleRate);
        for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
          const data = impulse.getChannelData(channel);
          for (let index = 0; index < data.length; index += 1) {
            const decay = Math.pow(1 - index / data.length, 2.4);
            data[index] = (Math.random() * 2 - 1) * decay;
          }
        }
        distortion.oversample = "4x";
        reverb.buffer = impulse;
        delay.delayTime.value = 0.63;
        dry.gain.value = 0.64;
        wet.gain.value = 0.38;
        master.gain.value = 0.82;
        source.connect(distortion);
        distortion.connect(dry);
        dry.connect(master);
        distortion.connect(delay);
        delay.connect(reverb);
        reverb.connect(wet);
        wet.connect(master);
        master.connect(context.destination);
        audioContext.current = context;
        musicDistortion.current = distortion;
        masterGain.current = master;
        dryGain.current = dry;
        wetGain.current = wet;
        musicDelay.current = delay;
      }
      if (audioContext.current.state === "suspended") void audioContext.current.resume();
      if (dryGain.current) dryGain.current.gain.value = 0.64;
      if (wetGain.current) wetGain.current.gain.value = 0.38;
      if (masterGain.current) masterGain.current.gain.value = 0.82;
      if (musicDelay.current) musicDelay.current.delayTime.value = 0.63;
      if (musicDistortion.current) musicDistortion.current.curve = createDistortionCurve(16 + intensity * 28);
      music.current.playbackRate = Math.max(0.5, 0.82 - intensity * 0.055);
      void music.current.play().catch(() => undefined);
    } catch {
      music.current.playbackRate = Math.max(0.5, 0.82 - intensity * 0.055);
      void music.current.play().catch(() => undefined);
    }
  };

  const playDistortedJingle = (intensity: number) => {
    if (!jingle.current) return;
    try {
      makeMusicUnsettling(intensity);
      const context = audioContext.current;
      if (!context) throw new Error("Audio context unavailable");
      if (!jingleSource.current) {
        const source = context.createMediaElementSource(jingle.current);
        const distortion = context.createWaveShaper();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        distortion.oversample = "4x";
        filter.type = "lowpass";
        source.connect(distortion);
        distortion.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        jingleSource.current = source;
        jingleDistortion.current = distortion;
        jingleFilter.current = filter;
        jingleGain.current = gain;
      }
      if (jingleDistortion.current) jingleDistortion.current.curve = createDistortionCurve(35 + intensity * 45);
      if (jingleFilter.current) { jingleFilter.current.frequency.value = Math.max(700, 4600 - intensity * 650); jingleFilter.current.Q.value = 4 + intensity * 2; }
      if (jingleGain.current) jingleGain.current.gain.value = 0.85;
      jingle.current.playbackRate = Math.max(0.55, 1 - intensity * 0.075);
      jingle.current.currentTime = 0;
      void jingle.current.play().catch(() => undefined);
    } catch {
      jingle.current.playbackRate = Math.max(0.55, 1 - intensity * 0.075);
      jingle.current.currentTime = 0;
      void jingle.current.play().catch(() => undefined);
    }
  };

  const stopMusic = () => {
    if (!music.current) return;
    music.current.pause();
    music.current.currentTime = 0;
    music.current.playbackRate = 1;
  };

  const stopAllAudio = () => {
    stopMusic();
    if (!jingle.current) return;
    jingle.current.pause();
    jingle.current.currentTime = 0;
    jingle.current.playbackRate = 1;
  };

  const restoreNormalAudio = () => {
    if (audioContext.current?.state === "suspended") void audioContext.current.resume();
    if (musicDistortion.current) musicDistortion.current.curve = null;
    if (dryGain.current) dryGain.current.gain.value = 1;
    if (wetGain.current) wetGain.current.gain.value = 0;
    if (masterGain.current) masterGain.current.gain.value = 1;
    if (musicDelay.current) musicDelay.current.delayTime.value = 0;
    if (jingle.current) { jingle.current.pause(); jingle.current.currentTime = 0; jingle.current.playbackRate = 1; }
    if (jingleDistortion.current) jingleDistortion.current.curve = null;
    if (jingleFilter.current) { jingleFilter.current.frequency.value = 22000; jingleFilter.current.Q.value = 0; }
    if (jingleGain.current) jingleGain.current.gain.value = 1;
    if (!music.current) return;
    music.current.playbackRate = 1;
    if (musicWasPlayingBeforeProceed.current) void music.current.play().catch(() => undefined);
    else { music.current.pause(); music.current.currentTime = 0; }
    musicWasPlayingBeforeProceed.current = false;
  };

  const createErrorWindow = (messages: string[]): ErrorWindow => {
    const panelWidth = Math.min(288, Math.max(230, window.innerWidth - 28));
    const panelHeight = 158;
    return { id: nextErrorId.current++, message: messages[Math.floor(Math.random() * messages.length)], x: Math.max(10, Math.random() * (window.innerWidth - panelWidth - 20)), y: Math.max(10, Math.random() * (window.innerHeight - panelHeight - 20)) };
  };

  const addFaultWindow = () => {
    setErrorWindows((current) => current.length >= 60 ? current : [...current, createErrorWindow(FAULT_MESSAGES)]);
  };

  const startDess = () => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    if (errorTimer.current) clearInterval(errorTimer.current);
    if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    setTyping(false);
    setLiveOutput("");
    setFaultMode(false);
    setDessMode(true);
    setErrorWindows([]);
    let errorCount = 0;
    errorTimer.current = setInterval(() => {
      setErrorWindows((current) => [...current, createErrorWindow(ERROR_MESSAGES)]);
      errorCount += 1;
      if (errorCount < 30) return;
      if (errorTimer.current) clearInterval(errorTimer.current);
      errorTimer.current = null;
      recoveryTimer.current = setTimeout(() => {
        setDessMode(false);
        setErrorWindows([]);
        addLine("warning", "[ CONNECTION RESTORED // SOME DATA COULD NOT BE RECOVERED ]");
        typeText("THE SCREEN COMES BACK.\n\nTHE LAKE IS STILL THERE.\n\nSO IS THE ECHO.\n\nTYPE /RESET IF YOU WANT TO PRETEND THIS DIDN'T HAPPEN.");
      }, 850);
    }, 105);
  };

  const startFaultCrash = () => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    if (errorTimer.current) clearInterval(errorTimer.current);
    if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    setTyping(false);
    setLiveOutput("");
    setProceedMenuOpen(false);
    setFinalScene(false);
    setFaultMode(true);
    setDessMode(true);
    setErrorWindows([]);
    let spawned = 0;
    errorTimer.current = setInterval(() => {
      addFaultWindow();
      spawned += 1;
      if (spawned < 60) return;
      if (errorTimer.current) clearInterval(errorTimer.current);
      errorTimer.current = null;
    }, 135);
  };

  const endProceedRoute = (restoreMusic: boolean, announcement?: string) => {
    if (proceedGraceTimer.current) clearTimeout(proceedGraceTimer.current);
    if (proceedFadeTimer.current) clearInterval(proceedFadeTimer.current);
    if (faultStartTimer.current) clearTimeout(faultStartTimer.current);
    proceedGraceTimer.current = null;
    proceedFadeTimer.current = null;
    faultStartTimer.current = null;
    whiteoutLevelRef.current = 0;
    setWhiteoutLevel(0);
    setProceedCount(0);
    setProceedMenuOpen(false);
    setProceedChoice("proceed");
    setFinalScene(false);
    if (restoreMusic) restoreNormalAudio(); else stopAllAudio();
    if (announcement) addLine("warning", announcement);
  };

  const beginProceedFade = () => {
    if (proceedGraceTimer.current) clearTimeout(proceedGraceTimer.current);
    if (proceedFadeTimer.current) clearInterval(proceedFadeTimer.current);
    proceedGraceTimer.current = setTimeout(() => {
      proceedGraceTimer.current = null;
      proceedFadeTimer.current = setInterval(() => {
        if (whiteoutLevelRef.current <= 1) {
          endProceedRoute(true, "[ PROCEED ROUTE TERMINATED // CONNECTION NORMAL ]");
          return;
        }
        whiteoutLevelRef.current -= 1;
        setWhiteoutLevel(whiteoutLevelRef.current);
      }, 1500);
    }, 7000);
  };

  const handleProceed = () => {
    if (proceedCount >= PROCEED_LINES.length) return;
    const nextCount = proceedCount + 1;
    setProceedCount(nextCount);
    whiteoutLevelRef.current = nextCount;
    setWhiteoutLevel(nextCount);
    playDistortedJingle(nextCount);
    typeText(PROCEED_LINES[nextCount - 1]);
    if (nextCount < PROCEED_LINES.length) { beginProceedFade(); return; }
    if (proceedFadeTimer.current) clearInterval(proceedFadeTimer.current);
    if (proceedGraceTimer.current) clearTimeout(proceedGraceTimer.current);
    proceedGraceTimer.current = null;
    proceedFadeTimer.current = null;
    faultStartTimer.current = setTimeout(() => {
      stopAllAudio();
      setFinalScene(true);
      faultStartTimer.current = setTimeout(() => startFaultCrash(), 2400);
    }, 900);
  };

  const openProceedDialog = () => {
    if (proceedGraceTimer.current) clearTimeout(proceedGraceTimer.current);
    if (proceedFadeTimer.current) clearInterval(proceedFadeTimer.current);
    proceedGraceTimer.current = null;
    proceedFadeTimer.current = null;
    if (proceedCount === 0) musicWasPlayingBeforeProceed.current = Boolean(music.current && !music.current.paused);
    setProceedChoice("proceed");
    setProceedMenuOpen(true);
  };

  const resolveProceedChoice = (choice: ProceedChoice) => {
    setProceedMenuOpen(false);
    if (choice === "stop") {
      endProceedRoute(true, "YOU PULL YOUR HAND AWAY.\n\nTHE WATER GOES STILL.");
      return;
    }
    handleProceed();
  };

  useEffect(() => {
    if (!proceedMenuOpen) return;
    const handleChoiceKeys = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        setProceedChoice((current) => current === "proceed" ? "stop" : "proceed");
      } else if (event.key === "Enter") {
        event.preventDefault();
        resolveProceedChoice(proceedChoice);
      } else if (event.key === "Escape") {
        event.preventDefault();
        resolveProceedChoice("stop");
      }
    };
    window.addEventListener("keydown", handleChoiceKeys);
    return () => window.removeEventListener("keydown", handleChoiceKeys);
  }, [proceedChoice, proceedMenuOpen, resolveProceedChoice]);

  const dismissError = (id: number) => {
    setErrorWindows((current) => current.filter((window) => window.id !== id));
    if (!faultMode) return;
    const timer = setTimeout(() => addFaultWindow(), 180);
    faultReappearTimers.current.push(timer);
  };

  const getHelpText = () => {
    const routeHint = ["/GIRL"];
    if (routeStage >= 1) routeHint.push("/SWORD");
    if (routeStage >= 2) routeHint.push("/1225");
    if (routeStage >= 3) routeHint.push("/LAKE");
    if (routeStage >= 4) routeHint.push("/ECHO");
    if (routeStage >= 5) routeHint.push("/DESS");
    return ["ECHO TERMINAL // AVAILABLE INPUTS", "", "/HELP     SHOW THIS LIST", "/CALLOUT  TEST THE CONNECTION", "/NEXT     REPEAT THE NEXT ROUTE INPUT", "/CLEAR    CLEAR TERMINAL HISTORY", "/RESET    RESET THE ROUTE", "", `ROUTE INPUTS: ${routeHint.join("  ")}`].join("\n");
  };

  const getNextText = () => {
    const nextCommands = ["/SWORD", "/1225", "/LAKE", "/ECHO", "/DESS"];
    const nextCommand = nextCommands[routeStage];
    return nextCommand ? `NEXT INPUT: ${nextCommand}` : "THERE IS NO NEXT STEP.\n\nTHERE IS ONLY /RESET.";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (bootState !== "terminal" || warningOpen || typing || dessMode || proceedMenuOpen || finalScene) return;
    const command = input.trim().toLowerCase();
    if (!command) return;
    setInput("");
    if (command === "/clear") { setHistory([]); setLiveOutput(""); return; }
    addLine("command", `> ${command.toUpperCase()}`);
    if (command === "/help") { typeText(getHelpText()); return; }
    if (command === "/next") { typeText(getNextText()); return; }
    if (command === "/reset") { endProceedRoute(false); setRouteStage(0); typeText("ROUTE STATE CLEARED.\n\nTHE TERMINAL REMEMBERS ANYWAY.\n\nNEXT INPUT: /GIRL"); return; }
    if (command === "/callout") {
      typeText(routeStage >= 4 ? "THE LINE OPENS.\n\nYOU HEAR WATER MOVING THROUGH A PHONE THAT IS NOT CONNECTED.\n\nTHEN: \"DON'T MAKE HER DO IT AGAIN.\"" : "YOUR CALLS WON'T BE ANSWERED.\nYOU WON'T BE HELPED.\nYOU WILL SUFFER.\n\nYOU CHOSE THIS PATH.");
      return;
    }
    if (command === "/proceed") { openProceedDialog(); return; }
    if (command === "/dess") {
      if (routeStage < 5) { typeText("THE NAME DOES NOT ANSWER.\n\nTHE WATER HAS NOT OPENED YET."); return; }
      makeMusicUnsettling();
      startDess();
      return;
    }
    const routeCommand = ROUTE_COMMANDS[command];
    if (!routeCommand) { typeText(`UNKNOWN COMMAND: ${command.toUpperCase()}`); return; }
    if (routeStage < routeCommand.minimumStage) { typeText("ACCESS DENIED.\n\nYOU ARE SKIPPING A MEMORY.\n\nTYPE /NEXT."); return; }
    setRouteStage((current) => Math.max(current, routeCommand.nextStage));
    if (routeCommand.startMusic) startNormalMusic();
    typeText(routeCommand.response, { playJingle: routeCommand.playJingle });
  };

  const renderText = (text: string) => text.split(/(\s+)/).map((word, index) => {
    const cleanWord = word.replace(/[.,!?;:'"]/g, "").toLowerCase();
    const isRed = ["you", "your", "you're", "youre"].includes(cleanWord);
    return <span key={`${word}-${index}`} className={isRed ? styles.redText : undefined}>{word}</span>;
  });

  if (bootState !== "terminal") {
    return <EthoBootScreen bootState={bootState} bootLoadingText={bootLoadingText} bootAudioError={bootAudioError} dvdPosition={dvdPosition} dvdVelocity={dvdVelocity} dvdSlotRef={dvdSlotRef} onPointerDown={handleDvdPointerDown} onPointerMove={handleDvdPointerMove} onPointerUp={handleDvdPointerUp} onRetryAudio={retryBootAudio} />;
  }

  const activeProceedPrompt = PROCEED_PROMPTS[Math.min(proceedCount, PROCEED_PROMPTS.length - 1)];

  return (
    <main className={`${styles.page} ${dessMode ? styles.dessPage : ""}`}>
      <div className={styles.crt}>
        {!dessMode && !finalScene && (
          <>
            <div className={styles.scanlines} />
            <div className={styles.screenNoise} />
            <div className={styles.vignette} />
            <EthoTerminalView history={history} liveOutput={liveOutput} input={input} warningOpen={warningOpen} typing={typing} dessMode={dessMode} proceedMenuOpen={proceedMenuOpen} finalScene={finalScene} terminalRef={terminalRef} inputRef={inputRef} activeProceedPrompt={activeProceedPrompt} proceedChoice={proceedChoice} whiteoutLevel={whiteoutLevel} proceedLineCount={PROCEED_LINES.length} onInputChange={setInput} onSubmit={handleSubmit} onProceedChoiceChange={setProceedChoice} onResolveProceed={resolveProceedChoice} renderText={renderText} />
          </>
        )}
        <FinalScene finalScene={finalScene} />
        <ErrorScene dessMode={dessMode} faultMode={faultMode} errorWindows={errorWindows} onDismiss={dismissError} />
        <PhotosensitivityWarning open={warningOpen} onClose={() => setWarningOpen(false)} />
      </div>
    </main>
  );
}
