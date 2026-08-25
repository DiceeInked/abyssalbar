"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./Etho.module.css";

type TerminalLine = {
  id: number;
  kind: "command" | "response" | "warning";
  text: string;
};

type ErrorWindow = {
  id: number;
  message: string;
  x: number;
  y: number;
};

type RouteCommand = {
  minimumStage: number;
  nextStage: number;
  response: string;
  startMusic?: boolean;
  playJingle?: boolean;
};

type ProceedChoice = "proceed" | "stop";

type ProceedPrompt = {
  heading: string;
  question: string;
  proceedLabel: string;
  stopLabel: string;
};

type BootState =
  | "insert"
  | "loading"
  | "terminal";

const INTRO: TerminalLine = {
  id: 0,
  kind: "warning",
  text:
    "ECHO TERMINAL // ACCESS NODE\nCONNECTION: UNSTABLE\n\nTYPE /HELP TO BEGIN.",
};

const ROUTE_COMMANDS: Record<string, RouteCommand> = {
  "/girl": {
    minimumStage: 0,
    nextStage: 1,
    startMusic: true,
    response:
      "IT STARTED WITH A GIRL WHO COULD MAKE ICE LISTEN.\n\nIN THE CITY, YOU TAUGHT HER TO ANSWER A QUESTION WITH ICE.\nIN THE CASTLE, YOU TAUGHT HER A SWORD CAN BE A COMMAND.\n\nNOW THE WATER IS WAITING.\n\nNEXT INPUT: /SWORD",
  },

  "/sword": {
    minimumStage: 1,
    nextStage: 2,
    response:
      "THE BLADE DID NOT CUT THEM.\n\nIT POINTED.\n\nYOU TOLD HER THE WORDS TILL SHE LISTEND.\nTHE ROOM GOT QUIET. THE ICE DID NOT.\n\nNEXT INPUT: /1225",
  },

  "/1225": {
    minimumStage: 2,
    nextStage: 3,
    playJingle: true,
    response:
      "I REMEMBER THE NUMBER.\n\nYOU REMEMBER THE NUMBER.\n\nSHE REMEMBERS WHAT HAPPENED AFTER YOU TOLD HER TO FREEZE THEM. ALL OF THEM.\n\nYOUR FREIND, DID HE HAVE TO DIE?. YOU TOLD HER CAST THE SPELL, YOU HAVE TO LIVE IN A WORLD BROKEN.\n\nNEXT INPUT: /LAKE",
  },

  "/lake": {
    minimumStage: 3,
    nextStage: 4,
    response:
      "THE LAKE DOESN'T FREEZE WHEN SHE LOOKS AT IT.\n\nIT HOLDS ITS BREATH.\n\nNOELLE WALKS FIRST THIS TIME YOU HAVE NO SAY. YOU MADE THEM DROWN, BECAUSE YOU ALREADY TAUGHT HER THAT FREEZING WAS THE ONLY OPTION.\n\nUNDER THE SURFACE, SOMETHING KNOCKS FROM THE OTHER SIDE.\n\nNEXT INPUT: /ECHO",
  },

  "/echo": {
    minimumStage: 4,
    nextStage: 5,
    response:
      "THE ECHO IS NOT D̵͚̿͗ë̴͕́̏s̸̫̽̈́s̶̪͛̅\n\nIT ONLY LEARNED HER NAME BECAUSE YOU KEPT ASKING FOR IT.\n\nTHE WATER SHOWS YOU A ROOM WITH NO DOOR. A SWORD LEANING AGAINST THE WALL. TWO SETS OF FOOTPRINTS GOING IN.\n\nNONE COME BACK. SHE WAS USED UP.\n\nYOU CAN STILL LEAVE: /RESET\nOR GO DEEPER: /DESS",
  },
};

const ERROR_MESSAGES = [
  "FATAL ERROR",
  "MEMORY ACCESS VIOLATION",
  "YOUR WERE USED UP",
  "UNKNOWN PROCESS",
  "SHE WAS USED UP",
  "ERROR: CONNECTION LOST",
  "CRITICAL EXCEPTION",
  "STACK OVERFLOW",
  "INVALID MEMORY ADDRESS",
  "PROCESS TERMINATED",
  "UNABLE TO READ DATA",
  "THE WATER IS LISTENING",
  "YOU WERE USED UP",
  "UNKNOWN ERROR",
  "ACCESS DENIED",
  "FATAL EXCEPTION",
  "KERNEL ERROR",
  "DO NOT CALL HER AGAIN",
  "ERROR 0x00000000",
  "UNABLE TO CONTINUE",
];

const PROCEED_LINES = [
  "STOP.",
  "WHAT ARE YOU DOING?",
  "THIS WILL ONLY DIG YOU DEEPER.",
  "YOU CAN STILL TURN BACK.",
  "SHE CAN HEAR YOU.",
  "YOU'RE GOING TO DEEP IN THE LAKE.",
  "YOU CHOSE THIS.",
  "GOODBYE.",
];

const PROCEED_PROMPTS: ProceedPrompt[] = [
  {
    heading: "THE WATER WAITS.",
    question: "PROCEED?",
    proceedLabel: "PROCEED",
    stopLabel: "STOP",
  },
  {
    heading: "A VOICE SPEAKS UNDER THE ICE.",
    question: "WHO TOLD HER TO DO IT?",
    proceedLabel: "KEEP LISTENING",
    stopLabel: "SAY NOTHING",
  },
  {
    heading: "SHE IS POINTING AT THE WATER.",
    question: "DO YOU TAKE HER HAND?",
    proceedLabel: "TAKE HER HAND",
    stopLabel: "STOP",
  },
  {
    heading: "THE SCREEN ASKS FOR A NAME.",
    question: "DO YOU ANSWER?",
    proceedLabel: "TYPE THE NAME",
    stopLabel: "REFUSE",
  },
  {
    heading: "THE HEART IS STILL MOVING.",
    question: "ONE MORE STEP?",
    proceedLabel: "ONE MORE STEP",
    stopLabel: "LET GO",
  },
  {
    heading: "THE WATER IS IN YOUR LUNGS.",
    question: "DO YOU CONTINUE?",
    proceedLabel: "PROCEED",
    stopLabel: "STOP",
  },
  {
    heading: "TWO SHADOWS MOVE UNDER THE SURFACE.",
    question: "DO YOU CALL TO THEM?",
    proceedLabel: "CALL OUT",
    stopLabel: "LET THEM GO",
  },
  {
    heading: "THE TERMINAL IS STILL LISTENING.",
    question: "DO YOU FINISH THIS?",
    proceedLabel: "FINISH IT",
    stopLabel: "CLOSE YOUR EYES",
  },
];

const FAULT_MESSAGES = [
  "IT'S YOUR FAULT.",
  "YOU DID THIS.",
  "SHE WAS LISTENING.",
  "YOU CHOSE THIS.",
  "YOU KEPT GOING.",
  "STOP PRETENDING.",
  "IT IS YOUR FAULT.",
];

const createDistortionCurve = (amount: number) => {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const degrees = Math.PI / 180;

  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;

    curve[index] =
      ((3 + amount) * x * 20 * degrees) /
      (Math.PI + amount * Math.abs(x));
  }

  return curve;
};

export default function Etho() {
  const [bootState, setBootState] = useState<BootState>("insert");
  const [diskInserted, setDiskInserted] = useState(false);

  const [input, setInput] = useState("");
  const [warningOpen, setWarningOpen] = useState(true);

  const [history, setHistory] = useState<TerminalLine[]>([INTRO]);
  const [dvdPosition, setDvdPosition] = use state({
    x: 300,
    y: 100,
  });
  const [liveOutput, setLiveOutput] = useState("");
  const [typing, setTyping] = useState(false);

  const [routeStage, setRouteStage] = useState(0);
  const [proceedCount, setProceedCount] = useState(0);
  const [whiteoutLevel, setWhiteoutLevel] = useState(0);

  const [proceedMenuOpen, setProceedMenuOpen] = useState(false);
  const [proceedChoice, setProceedChoice] =
    useState<ProceedChoice>("proceed");

  const [finalScene, setFinalScene] = useState(false);
  const [dessMode, setDessMode] = useState(false);
  const [faultMode, setFaultMode] = useState(false);
  const [errorWindows, setErrorWindows] = useState<ErrorWindow[]>([]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const nextLineId = useRef(1);

  const whiteoutLevelRef = useRef(0);

  const musicWasPlayingBeforeProceed =
    useRef(false);

  const typingTimer =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const errorTimer =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const recoveryTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const proceedGraceTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const proceedFadeTimer =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const faultStartTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const faultReappearTimers =
    useRef<ReturnType<typeof setTimeout>[]>([]);

  const nextErrorId = useRef(0);

  /*
   * Boot audio.
   *
   * The file should physically be here:
   *
   * public/
   * └── HDD.mp3
   *
   * Next.js exposes the public folder from the website root,
   * so the browser URL is /HDD.mp3.
   */
  const hddAudio = useRef<HTMLAudioElement | null>(null);

  const jingle = useRef<HTMLAudioElement | null>(null);
  const music = useRef<HTMLAudioElement | null>(null);

  const audioContext = useRef<AudioContext | null>(null);

  const musicSource =
    useRef<MediaElementAudioSourceNode | null>(null);

  const musicDistortion =
    useRef<WaveShaperNode | null>(null);

  const masterGain =
    useRef<GainNode | null>(null);

  const dryGain =
    useRef<GainNode | null>(null);

  const wetGain =
    useRef<GainNode | null>(null);

  const musicDelay =
    useRef<DelayNode | null>(null);

  const musicReverb =
    useRef<ConvolverNode | null>(null);

  const jingleSource =
    useRef<MediaElementAudioSourceNode | null>(null);

  const jingleDistortion =
    useRef<WaveShaperNode | null>(null);

  const jingleFilter =
    useRef<BiquadFilterNode | null>(null);

  const jingleGain =
    useRef<GainNode | null>(null);

  const addLine = (
    kind: TerminalLine["kind"],
    text: string
  ) => {
    setHistory((current) => [
      ...current,
      {
        id: nextLineId.current++,
        kind,
        text,
      },
    ]);
  };

  /*
   * BOOT AUDIO
   */
  useEffect(() => {
    /*
     * IMPORTANT:
     *
     * Your actual file goes in:
     *
     * public/HDD.mp3
     *
     * The browser path is:
     *
     * /HDD.mp3
     */
    const audio = new Audio("/HDD.mp3");

    audio.preload = "auto";

    hddAudio.current = audio;

    const handleEnded = () => {
      setBootState("terminal");
      setDiskInserted(false);

      addLine(
        "warning",
        "[ HDD AUDIO COMPLETE // ECHO TERMINAL READY ]"
      );
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.currentTime = 0;

      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, []);

  /*
   * Insert the disk.
   */
  const insertDisk = () => {
    if (diskInserted || bootState !== "insert") {
      return;
    }

    setDiskInserted(true);
    setBootState("loading");

    /*
     * The terminal isn't visible yet, but this creates
     * the loading state that appears after insertion.
     */
    const audio = hddAudio.current;

    if (!audio) {
      setBootState("terminal");
      return;
    }

    audio.currentTime = 0;

    void audio.play().catch(() => {
      /*
       * If the browser rejects playback, clicking the
       * disk again / user interaction will still allow
       * the terminal to continue.
       */
    });
  };

  /*
   * Allow the disk to be dragged into the DVD slot.
   */
  const handleDiskDragStart = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.dataTransfer.setData(
      "text/plain",
      "chapter-7-side-b"
    );
  };

  const handleSlotDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
  };

  const handleSlotDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const data =
      event.dataTransfer.getData("text/plain");

    if (data === "chapter-7-side-b") {
      insertDisk();
    }
  };

  /*
   * Clicking the disk also inserts it.
   * This makes the boot usable on touch/mobile devices
   * where HTML5 drag/drop may not work.
   */
  const handleDiskClick = () => {
    insertDisk();
  };

  /*
   * Terminal audio initialization.
   */
  useEffect(() => {
    jingle.current = new Audio(
      "/weird-route-jingle.mp3"
    );

    music.current = new Audio("/glacier.ogg");

    music.current.loop = true;
    music.current.crossOrigin = "anonymous";

    return () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }

      if (errorTimer.current) {
        clearInterval(errorTimer.current);
      }

      if (recoveryTimer.current) {
        clearTimeout(recoveryTimer.current);
      }

      if (proceedGraceTimer.current) {
        clearTimeout(proceedGraceTimer.current);
      }

      if (proceedFadeTimer.current) {
        clearInterval(proceedFadeTimer.current);
      }

      if (faultStartTimer.current) {
        clearTimeout(faultStartTimer.current);
      }

      faultReappearTimers.current.forEach(
        (timer) => clearTimeout(timer)
      );

      jingle.current?.pause();

      if (jingle.current) {
        jingle.current.currentTime = 0;
      }

      music.current?.pause();

      if (music.current) {
        music.current.currentTime = 0;
      }

      hddAudio.current?.pause();

      if (hddAudio.current) {
        hddAudio.current.currentTime = 0;
      }

      if (
        audioContext.current &&
        audioContext.current.state !== "closed"
      ) {
        void audioContext.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;

    if (terminal) {
      terminal.scrollTop =
        terminal.scrollHeight;
    }
  }, [history, liveOutput]);

  useEffect(() => {
    if (
      bootState === "terminal" &&
      !warningOpen &&
      !typing &&
      !dessMode &&
      !proceedMenuOpen &&
      !finalScene
    ) {
      inputRef.current?.focus();
    }
  }, [
    bootState,
    warningOpen,
    typing,
    dessMode,
    proceedMenuOpen,
    finalScene,
  ]);

  const typeText = (
    text: string,
    options: Pick<
      RouteCommand,
      "playJingle"
    > = {}
  ) => {
    if (typingTimer.current) {
      clearInterval(typingTimer.current);
    }

    setLiveOutput("");
    setTyping(true);

    let index = 0;

    typingTimer.current =
      setInterval(() => {
        index += 1;

        setLiveOutput(
          text.slice(0, index)
        );

        if (index < text.length) {
          return;
        }

        if (typingTimer.current) {
          clearInterval(
            typingTimer.current
          );
        }

        typingTimer.current = null;

        setTyping(false);
        setLiveOutput("");

        addLine("response", text);

        if (
          options.playJingle &&
          jingle.current
        ) {
          jingle.current.currentTime = 0;

          void jingle.current
            .play()
            .catch(() => undefined);
        }
      }, 28);
  };

  const startNormalMusic = () => {
    if (!music.current) {
      return;
    }

    if (
      audioContext.current?.state ===
      "suspended"
    ) {
      void audioContext.current.resume();
    }

    if (dryGain.current) {
      dryGain.current.gain.value = 1;
    }

    if (wetGain.current) {
      wetGain.current.gain.value = 0;
    }

    if (masterGain.current) {
      masterGain.current.gain.value = 1;
    }

    if (musicDelay.current) {
      musicDelay.current.delayTime.value = 0;
    }

    if (musicDistortion.current) {
      musicDistortion.current.curve = null;
    }

    music.current.playbackRate = 1;
    music.current.currentTime = 0;

    void music.current
      .play()
      .catch(() => undefined);
  };

  const makeMusicUnsettling = (
    intensity = 1
  ) => {
    if (!music.current) {
      return;
    }

    try {
      if (!audioContext.current) {
        const context =
          new AudioContext();

        const source =
          context.createMediaElementSource(
            music.current
          );

        const distortion =
          context.createWaveShaper();

        const master =
          context.createGain();

        const dry =
          context.createGain();

        const wet =
          context.createGain();

        const delay =
          context.createDelay(4);

        const reverb =
          context.createConvolver();

        const duration = 2.6;

        const impulse =
          context.createBuffer(
            2,
            Math.floor(
              context.sampleRate *
                duration
            ),
            context.sampleRate
          );

        for (
          let channel = 0;
          channel <
          impulse.numberOfChannels;
          channel += 1
        ) {
          const data =
            impulse.getChannelData(
              channel
            );

          for (
            let index = 0;
            index < data.length;
            index += 1
          ) {
            const decay = Math.pow(
              1 -
                index /
                  data.length,
              2.4
            );

            data[index] =
              (Math.random() * 2 - 1) *
              decay;
          }
        }

        distortion.oversample = "4x";

        reverb.buffer = impulse;

        delay.delayTime.value =
          0.63;

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

        master.connect(
          context.destination
        );

        audioContext.current =
          context;

        musicSource.current =
          source;

        musicDistortion.current =
          distortion;

        masterGain.current =
          master;

        dryGain.current = dry;
        wetGain.current = wet;

        musicDelay.current =
          delay;

        musicReverb.current =
          reverb;
      }

      if (
        audioContext.current.state ===
        "suspended"
      ) {
        void audioContext.current.resume();
      }

      if (dryGain.current) {
        dryGain.current.gain.value =
          0.64;
      }

      if (wetGain.current) {
        wetGain.current.gain.value =
          0.38;
      }

      if (masterGain.current) {
        masterGain.current.gain.value =
          0.82;
      }

      if (musicDelay.current) {
        musicDelay.current.delayTime.value =
          0.63;
      }

      if (musicDistortion.current) {
        musicDistortion.current.curve =
          createDistortionCurve(
            16 + intensity * 28
          );
      }

      music.current.playbackRate =
        Math.max(
          0.5,
          0.82 -
            intensity * 0.055
        );

      void music.current
        .play()
        .catch(() => undefined);
    } catch {
      music.current.playbackRate =
        Math.max(
          0.5,
          0.82 -
            intensity * 0.055
        );

      void music.current
        .play()
        .catch(() => undefined);
    }
  };

  const playDistortedJingle = (
    intensity: number
  ) => {
    if (!jingle.current) {
      return;
    }

    try {
      makeMusicUnsettling(
        intensity
      );

      const context =
        audioContext.current;

      if (!context) {
        throw new Error(
          "Audio context unavailable"
        );
      }

      if (!jingleSource.current) {
        const source =
          context.createMediaElementSource(
            jingle.current
          );

        const distortion =
          context.createWaveShaper();

        const filter =
          context.createBiquadFilter();

        const gain =
          context.createGain();

        distortion.oversample =
          "4x";

        filter.type = "lowpass";

        source.connect(
          distortion
        );

        distortion.connect(
          filter
        );

        filter.connect(gain);
        gain.connect(
          context.destination
        );

        jingleSource.current =
          source;

        jingleDistortion.current =
          distortion;

        jingleFilter.current =
          filter;

        jingleGain.current =
          gain;
      }

      if (
        jingleDistortion.current
      ) {
        jingleDistortion.current.curve =
          createDistortionCurve(
            35 +
              intensity * 45
          );
      }

      if (
        jingleFilter.current
      ) {
        jingleFilter.current.frequency.value =
          Math.max(
            700,
            4600 -
              intensity * 650
          );

        jingleFilter.current.Q.value =
          4 +
          intensity * 2;
      }

      if (jingleGain.current) {
        jingleGain.current.gain.value =
          0.85;
      }

      jingle.current.playbackRate =
        Math.max(
          0.55,
          1 -
            intensity * 0.075
        );

      jingle.current.currentTime = 0;

      void jingle.current
        .play()
        .catch(() => undefined);
    } catch {
      jingle.current.playbackRate =
        Math.max(
          0.55,
          1 -
            intensity * 0.075
        );

      jingle.current.currentTime = 0;

      void jingle.current
        .play()
        .catch(() => undefined);
    }
  };

  const stopMusic = () => {
    if (!music.current) {
      return;
    }

    music.current.pause();
    music.current.currentTime = 0;
    music.current.playbackRate = 1;
  };

  const stopAllAudio = () => {
    stopMusic();

    if (!jingle.current) {
      return;
    }

    jingle.current.pause();
    jingle.current.currentTime = 0;
    jingle.current.playbackRate = 1;
  };

  const restoreNormalAudio = () => {
    if (
      audioContext.current?.state ===
      "suspended"
    ) {
      void audioContext.current.resume();
    }

    if (musicDistortion.current) {
      musicDistortion.current.curve =
        null;
    }

    if (dryGain.current) {
      dryGain.current.gain.value = 1;
    }

    if (wetGain.current) {
      wetGain.current.gain.value = 0;
    }

    if (masterGain.current) {
      masterGain.current.gain.value = 1;
    }

    if (musicDelay.current) {
      musicDelay.current.delayTime.value =
        0;
    }

    if (jingle.current) {
      jingle.current.pause();
      jingle.current.currentTime = 0;
      jingle.current.playbackRate = 1;
    }

    if (jingleDistortion.current) {
      jingleDistortion.current.curve =
        null;
    }

    if (jingleFilter.current) {
      jingleFilter.current.frequency.value =
        22000;

      jingleFilter.current.Q.value =
        0;
    }

    if (jingleGain.current) {
      jingleGain.current.gain.value =
        1;
    }

    if (!music.current) {
      return;
    }

    music.current.playbackRate = 1;

    if (
      musicWasPlayingBeforeProceed.current
    ) {
      void music.current
        .play()
        .catch(() => undefined);
    } else {
      music.current.pause();
      music.current.currentTime = 0;
    }

    musicWasPlayingBeforeProceed.current =
      false;
  };

  const createErrorWindow = (
    messages: string[]
  ): ErrorWindow => {
    const panelWidth = Math.min(
      288,
      Math.max(
        230,
        window.innerWidth - 28
      )
    );

    const panelHeight = 158;

    return {
      id: nextErrorId.current++,
      message:
        messages[
          Math.floor(
            Math.random() *
              messages.length
          )
        ],
      x: Math.max(
        10,
        Math.random() *
          (window.innerWidth -
            panelWidth -
            20)
      ),
      y: Math.max(
        10,
        Math.random() *
          (window.innerHeight -
            panelHeight -
            20)
      ),
    };
  };

  const addFaultWindow = () => {
    setErrorWindows((current) => {
      if (current.length >= 60) {
        return current;
      }

      return [
        ...current,
        createErrorWindow(
          FAULT_MESSAGES
        ),
      ];
    });
  };

  const startDess = () => {
    if (typingTimer.current) {
      clearInterval(
        typingTimer.current
      );
    }

    if (errorTimer.current) {
      clearInterval(
        errorTimer.current
      );
    }

    if (recoveryTimer.current) {
      clearTimeout(
        recoveryTimer.current
      );
    }

    setTyping(false);
    setLiveOutput("");
    setFaultMode(false);
    setDessMode(true);
    setErrorWindows([]);

    let errorCount = 0;

    errorTimer.current =
      setInterval(() => {
        setErrorWindows(
          (current) => [
            ...current,
            createErrorWindow(
              ERROR_MESSAGES
            ),
          ]
        );

        errorCount += 1;

        if (errorCount < 60) {
          return;
        }

        if (errorTimer.current) {
          clearInterval(
            errorTimer.current
          );
        }

        errorTimer.current = null;

        recoveryTimer.current =
          setTimeout(() => {
            setDessMode(false);
            setErrorWindows([]);

            addLine(
              "warning",
              "[ CONNECTION RESTORED // SOME DATA COULD NOT BE RECOVERED ]"
            );

            typeText(
              "THE SCREEN COMES BACK.\n\nTHE LAKE IS STILL THERE.\n\nSO IS THE ECHO.\n\nTYPE /RESET IF YOU WANT TO PRETEND THIS DIDN'T HAPPEN."
            );
          }, 850);
      }, 105);
  };

  const startFaultCrash = () => {
    if (typingTimer.current) {
      clearInterval(
        typingTimer.current
      );
    }

    if (errorTimer.current) {
      clearInterval(
        errorTimer.current
      );
    }

    if (recoveryTimer.current) {
      clearTimeout(
        recoveryTimer.current
      );
    }

    setTyping(false);
    setLiveOutput("");
    setProceedMenuOpen(false);
    setFinalScene(false);
    setFaultMode(true);
    setDessMode(true);
    setErrorWindows([]);

    let spawned = 0;

    errorTimer.current =
      setInterval(() => {
        addFaultWindow();
        spawned += 1;

        if (spawned < 14) {
          return;
        }

        if (errorTimer.current) {
          clearInterval(
            errorTimer.current
          );
        }

        errorTimer.current = null;
      }, 135);
  };

  const endProceedRoute = (
    restoreMusic: boolean,
    announcement?: string
  ) => {
    if (proceedGraceTimer.current) {
      clearTimeout(
        proceedGraceTimer.current
      );
    }

    if (proceedFadeTimer.current) {
      clearInterval(
        proceedFadeTimer.current
      );
    }

    if (faultStartTimer.current) {
      clearTimeout(
        faultStartTimer.current
      );
    }

    proceedGraceTimer.current = null;
    proceedFadeTimer.current = null;
    faultStartTimer.current = null;

    whiteoutLevelRef.current = 0;
    setWhiteoutLevel(0);

    setProceedCount(0);
    setProceedMenuOpen(false);
    setProceedChoice("proceed");
    setFinalScene(false);

    if (restoreMusic) {
      restoreNormalAudio();
    } else {
      stopAllAudio();
    }

    if (announcement) {
      addLine(
        "warning",
        announcement
      );
    }
  };

  const beginProceedFade = () => {
    if (proceedGraceTimer.current) {
      clearTimeout(
        proceedGraceTimer.current
      );
    }

    if (proceedFadeTimer.current) {
      clearInterval(
        proceedFadeTimer.current
      );
    }

    proceedGraceTimer.current =
      setTimeout(() => {
        proceedGraceTimer.current =
          null;

        proceedFadeTimer.current =
          setInterval(() => {
            if (
              whiteoutLevelRef.current <=
              1
            ) {
              endProceedRoute(
                true,
                "[ PROCEED ROUTE TERMINATED // CONNECTION NORMAL ]"
              );

              return;
            }

            whiteoutLevelRef.current -=
              1;

            setWhiteoutLevel(
              whiteoutLevelRef.current
            );
          }, 1500);
      }, 7000);
  };

  const handleProceed = () => {
    if (
      proceedCount >=
      PROCEED_LINES.length
    ) {
      return;
    }

    const nextCount =
      proceedCount + 1;

    setProceedCount(nextCount);

    whiteoutLevelRef.current =
      nextCount;

    setWhiteoutLevel(
      nextCount
    );

    playDistortedJingle(
      nextCount
    );

    typeText(
      PROCEED_LINES[
        nextCount - 1
      ]
    );

    if (
      nextCount <
      PROCEED_LINES.length
    ) {
      beginProceedFade();
      return;
    }

    if (proceedFadeTimer.current) {
      clearInterval(
        proceedFadeTimer.current
      );
    }

    if (proceedGraceTimer.current) {
      clearTimeout(
        proceedGraceTimer.current
      );
    }

    proceedGraceTimer.current = null;
    proceedFadeTimer.current = null;

    faultStartTimer.current =
      setTimeout(() => {
        stopAllAudio();
        setFinalScene(true);

        faultStartTimer.current =
          setTimeout(() => {
            startFaultCrash();
          }, 2400);
      }, 900);
  };

  const openProceedDialog = () => {
    if (proceedGraceTimer.current) {
      clearTimeout(
        proceedGraceTimer.current
      );
    }

    if (proceedFadeTimer.current) {
      clearInterval(
        proceedFadeTimer.current
      );
    }

    proceedGraceTimer.current = null;
    proceedFadeTimer.current = null;

    if (proceedCount === 0) {
      musicWasPlayingBeforeProceed.current =
        Boolean(
          music.current &&
            !music.current.paused
        );
    }

    setProceedChoice("proceed");
    setProceedMenuOpen(true);
  };

  const resolveProceedChoice = (
    choice: ProceedChoice
  ) => {
    setProceedMenuOpen(false);

    if (choice === "stop") {
      endProceedRoute(
        true,
        "YOU PULL YOUR HAND AWAY.\n\nTHE WATER GOES STILL."
      );

      return;
    }

    handleProceed();
  };

  useEffect(() => {
    if (!proceedMenuOpen) {
      return;
    }

    const handleChoiceKeys = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        setProceedChoice(
          (current) =>
            current === "proceed"
              ? "stop"
              : "proceed"
        );

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        resolveProceedChoice(
          proceedChoice
        );

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();

        resolveProceedChoice("stop");
      }
    };

    window.addEventListener(
      "keydown",
      handleChoiceKeys
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleChoiceKeys
      );
  }, [
    proceedChoice,
    proceedMenuOpen,
  ]);

  const dismissError = (
    id: number
  ) => {
    setErrorWindows(
      (current) =>
        current.filter(
          (window) =>
            window.id !== id
        )
    );

    if (!faultMode) {
      return;
    }

    const timer = setTimeout(
      () => {
        addFaultWindow();
      },
      180
    );

    faultReappearTimers.current.push(
      timer
    );
  };

  const getHelpText = () => {
    const routeHint = ["/GIRL"];

    if (routeStage >= 1) {
      routeHint.push("/SWORD");
    }

    if (routeStage >= 2) {
      routeHint.push("/1225");
    }

    if (routeStage >= 3) {
      routeHint.push("/LAKE");
    }

    if (routeStage >= 4) {
      routeHint.push("/ECHO");
    }

    if (routeStage >= 5) {
      routeHint.push("/DESS");
    }

    return [
      "ECHO TERMINAL // AVAILABLE INPUTS",
      "",
      "/HELP     SHOW THIS LIST",
      "/CALLOUT  TEST THE CONNECTION",
      "/NEXT     REPEAT THE NEXT ROUTE INPUT",
      "/CLEAR    CLEAR TERMINAL HISTORY",
      "/RESET    RESET THE ROUTE",
      "",
      `ROUTE INPUTS: ${routeHint.join(
        "  "
      )}`,
    ].join("\n");
  };

  const getNextText = () => {
    const nextCommands = [
      "/SWORD",
      "/1225",
      "/LAKE",
      "/ECHO",
      "/DESS",
    ];

    const nextCommand =
      nextCommands[routeStage];

    if (!nextCommand) {
      return "THERE IS NO NEXT STEP.\n\nTHERE IS ONLY /RESET.";
    }

    return `NEXT INPUT: ${nextCommand}`;
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      bootState !== "terminal" ||
      warningOpen ||
      typing ||
      dessMode ||
      proceedMenuOpen ||
      finalScene
    ) {
      return;
    }

    const command =
      input.trim().toLowerCase();

    if (!command) {
      return;
    }

    setInput("");

    if (command === "/clear") {
      setHistory([]);
      setLiveOutput("");
      return;
    }

    addLine(
      "command",
      `> ${command.toUpperCase()}`
    );

    if (command === "/help") {
      typeText(getHelpText());
      return;
    }

    if (command === "/next") {
      typeText(getNextText());
      return;
    }

    if (command === "/reset") {
      endProceedRoute(false);

      setRouteStage(0);

      typeText(
        "ROUTE STATE CLEARED.\n\nTHE TERMINAL REMEMBERS ANYWAY.\n\nNEXT INPUT: /GIRL"
      );

      return;
    }

    if (command === "/callout") {
      const response =
        routeStage >= 4
          ? "THE LINE OPENS.\n\nYOU HEAR WATER MOVING THROUGH A PHONE THAT IS NOT CONNECTED.\n\nTHEN: \"DON'T MAKE HER DO IT AGAIN.\""
          : "YOUR CALLS WON'T BE ANSWERED.\nYOU WON'T BE HELPED.\nYOU WILL SUFFER.\n\nYOU CHOSE THIS PATH.";

      typeText(response);
      return;
    }

    if (command === "/proceed") {
      openProceedDialog();
      return;
    }

    if (command === "/dess") {
      if (routeStage < 5) {
        typeText(
          "THE NAME DOES NOT ANSWER.\n\nTHE WATER HAS NOT OPENED YET."
        );

        return;
      }

      makeMusicUnsettling();
      startDess();

      return;
    }

    const routeCommand =
      ROUTE_COMMANDS[command];

    if (!routeCommand) {
      typeText(
        `UNKNOWN COMMAND: ${command.toUpperCase()}`
      );

      return;
    }

    if (
      routeStage <
      routeCommand.minimumStage
    ) {
      typeText(
        "ACCESS DENIED.\n\nYOU ARE SKIPPING A MEMORY.\n\nTYPE /NEXT."
      );

      return;
    }

    setRouteStage(
      (current) =>
        Math.max(
          current,
          routeCommand.nextStage
        )
    );

    if (routeCommand.startMusic) {
      startNormalMusic();
    }

    typeText(
      routeCommand.response,
      {
        playJingle:
          routeCommand.playJingle,
      }
    );
  };

  const renderText = (
    text: string
  ) => {
    return text
      .split(/(\s+)/)
      .map((word, index) => {
        const cleanWord =
          word
            .replace(
              /[.,!?;:'"]/g,
              ""
            )
            .toLowerCase();

        const isRed = [
          "you",
          "your",
          "you're",
          "youre",
        ].includes(cleanWord);

        return (
          <span
            key={`${word}-${index}`}
            className={
              isRed
                ? styles.redText
                : undefined
            }
          >
            {word}
          </span>
        );
      });
  };

  const activeProceedPrompt =
    PROCEED_PROMPTS[
      Math.min(
        proceedCount,
        PROCEED_PROMPTS.length - 1
      )
    ];

  /*
   * =========================
   * BOOT SCREEN
   * =========================
   */

  if (bootState === "insert") {
    return (
      <main className={styles.bootPage}>
        <div className={styles.bootCRT}>
          <div className={styles.bootScanlines} />
          <div className={styles.bootNoise} />
          <div className={styles.bootVignette} />

          <div className={styles.bootContent}>
            <h1 className={styles.insertTitle}>
              INSERT CHAPTER 7 SIDE B
            </h1>

            <p className={styles.insertSubtitle}>
              ECHO TERMINAL SYSTEM
            </p>

            <div
              className={`${styles.diskArea} ${
                diskInserted
                  ? styles.diskInserted
                  : ""
              }`}
            >
              <div
                className={styles.disk}
                draggable={!diskInserted}
                onDragStart={
                  handleDiskDragStart
                }
                onClick={
                  handleDiskClick
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    handleDiskClick();
                  }
                }}
                aria-label="Insert Chapter 7 Side B disc"
              >
                <div
                  className={
                    styles.diskOuterRing
                  }
                />

                <div
                  className={
                    styles.diskInnerRing
                  }
                />

                <div
                  className={
                    styles.diskLabel
                  }
                >
                  <span>
                    CHAPTER 7
                  </span>

                  <strong>
                    SIDE B
                  </strong>

                  <small>
                    ECHO
                  </small>
                </div>

                <div
                  className={
                    styles.diskHole
                  }
                />
              </div>
            </div>

            <div
              className={styles.dvdSlot}
              onDragOver={
                handleSlotDragOver
              }
              onDrop={
                handleSlotDrop
              }
            >
              <div
                className={
                  styles.dvdSlotOpening
                }
              />

              <span
                className={
                  styles.dvdSlotLabel
                }
              >
                DVD DRIVE
              </span>

              <span
                className={
                  styles.dvdSlotStatus
                }
              >
                INSERT DISC
              </span>
            </div>

            <p
              className={
                styles.bootInstruction
              }
            >
              DRAG DISC INTO DRIVE
              <br />
              OR CLICK DISC TO INSERT
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================
   * LOADING SCREEN
   * =========================
   */

  if (bootState === "loading") {
    return (
      <main className={styles.bootPage}>
        <div className={styles.bootCRT}>
          <div className={styles.bootScanlines} />
          <div className={styles.bootNoise} />
          <div className={styles.bootVignette} />

          <div
            className={
              styles.loadingContent
            }
          >
            <div
              className={
                styles.loadingDisk
              }
            >
              <div
                className={
                  styles.loadingDiskLabel
                }
              >
                SIDE B
              </div>
            </div>

            <h1>
              LOADING
            </h1>

            <p>
              INSERT CHAPTER 7 SIDE B
            </p>

            <div
              className={
                styles.loadingBar
              }
            >
              <div
                className={
                  styles.loadingBarFill
                }
              />
            </div>

            <p
              className={
                styles.loadingStatus
              }
            >
              READING DISC...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================
   * ORIGINAL TERMINAL
   * =========================
   */

  return (
    <main
      className={`${styles.page} ${
        dessMode
          ? styles.dessPage
          : ""
      }`}
    >
      <div className={styles.crt}>
        {!dessMode &&
          !finalScene && (
            <>
              <div
                className={
                  styles.scanlines
                }
              />

              <div
                className={
                  styles.screenNoise
                }
              />

              <div
                className={
                  styles.vignette
                }
              />

              <div
                className={
                  styles.whiteout
                }
                style={{
                  opacity:
                    whiteoutLevel /
                    PROCEED_LINES.length,
                }}
              />

              <div
                className={
                  styles.content
                }
              >
                <div
                  ref={terminalRef}
                  className={
                    styles.output
                  }
                  aria-live="polite"
                >
                  {history.map(
                    (line) => (
                      <p
                        key={line.id}
                        className={`${styles.line} ${styles[line.kind]}`}
                      >
                        {renderText(
                          line.text
                        )}
                      </p>
                    )
                  )}

                  {liveOutput && (
                    <p
                      className={`${styles.line} ${styles.response}`}
                    >
                      {renderText(
                        liveOutput
                      )}

                      <span
                        className={
                          styles.cursor
                        }
                      >
                        _
                      </span>
                    </p>
                  )}
                </div>

                <form
                  className={
                    styles.inputArea
                  }
                  onSubmit={
                    handleSubmit
                  }
                >
                  <span
                    className={
                      styles.prompt
                    }
                  >
                    &gt;
                  </span>

                  <input
                    ref={inputRef}
                    className={
                      styles.input
                    }
                    type="text"
                    value={input}
                    onChange={(event) =>
                      setInput(
                        event.target
                          .value
                      )
                    }
                    placeholder="TYPE /COMMAND..."
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Echo terminal command input"
                    disabled={
                      warningOpen ||
                      typing ||
                      dessMode ||
                      proceedMenuOpen ||
                      finalScene
                    }
                  />
                </form>
              </div>

              {proceedMenuOpen && (
                <div
                  className={
                    styles.choiceOverlay
                  }
                >
                  <div
                    className={
                      styles.choiceBox
                    }
                    role="dialog"
                    aria-modal="true"
                    aria-label="Proceed route choice"
                  >
                    <p
                      className={
                        styles.choiceQuestion
                      }
                    >
                      {
                        activeProceedPrompt.heading
                      }
                    </p>

                    <p
                      className={
                        styles.choicePrompt
                      }
                    >
                      {
                        activeProceedPrompt.question
                      }
                    </p>

                    <div
                      className={
                        styles.choiceList
                      }
                    >
                      <button
                        type="button"
                        className={`${styles.choiceOption} ${
                          proceedChoice ===
                          "proceed"
                            ? styles.choiceSelected
                            : ""
                        }`}
                        onMouseEnter={() =>
                          setProceedChoice(
                            "proceed"
                          )
                        }
                        onFocus={() =>
                          setProceedChoice(
                            "proceed"
                          )
                        }
                        onClick={() =>
                          resolveProceedChoice(
                            "proceed"
                          )
                        }
                      >
                        <span
                          className={`${styles.soulCursor} ${
                            proceedChoice ===
                            "proceed"
                              ? styles.soulVisible
                              : ""
                          }`}
                          aria-hidden="true"
                        />

                        {
                          activeProceedPrompt.proceedLabel
                        }
                      </button>

                      <button
                        type="button"
                        className={`${styles.choiceOption} ${
                          proceedChoice ===
                          "stop"
                            ? styles.choiceSelected
                            : ""
                        }`}
                        onMouseEnter={() =>
                          setProceedChoice(
                            "stop"
                          )
                        }
                        onFocus={() =>
                          setProceedChoice(
                            "stop"
                          )
                        }
                        onClick={() =>
                          resolveProceedChoice(
                            "stop"
                          )
                        }
                      >
                        <span
                          className={`${styles.soulCursor} ${
                            proceedChoice ===
                            "stop"
                              ? styles.soulVisible
                              : ""
                          }`}
                          aria-hidden="true"
                        />

                        {
                          activeProceedPrompt.stopLabel
                        }
                      </button>
                    </div>

                    <p
                      className={
                        styles.choiceHint
                      }
                    >
                      ARROW KEYS + ENTER
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

        {finalScene && (
          <div
            className={
              styles.finalScene
            }
            aria-live="assertive"
          >
            <div
              className={
                styles.finalWater
              }
            />

            <p
              className={
                styles.finalHeader
              }
            >
              REMOTE VIEW // FINAL FRAME
            </p>

            <div
              className={
                styles.finalMessage
              }
            >
              <p>
                THE LAKE IS INSIDE THE SCREEN.
              </p>

              <p>
                KRIS IS STILL WALKING.
              </p>

              <p>
                NOELLE IS STILL FOLLOWING.
              </p>

              <p>
                YOU ARE STILL PRESSING ENTER.
              </p>

              <p>
                THEY ARE STILL DROWNING IN THE LAKE BECAUSE OF YOU.
              </p>
            </div>

            <span
              className={
                styles.finalSoul
              }
              aria-hidden="true"
            >
              ♥
            </span>

            <p
              className={
                styles.finalWhisper
              }
            >
              YOU WERE NEVER HOLDING THE CONTROLLER.
            </p>
          </div>
        )}

        {dessMode && (
          <div
            className={
              styles.errorScreen
            }
            aria-label="Terminal failure sequence"
          >
            {errorWindows.map(
              (error) => (
                <div
                  key={error.id}
                  className={
                    styles.errorWindow
                  }
                  style={{
                    left: error.x,
                    top: error.y,
                  }}
                >
                  <div
                    className={
                      styles.errorTitle
                    }
                  >
                    {faultMode
                      ? "YOU.EXE - FATAL ERROR"
                      : "LAKE.EXE - SYSTEM ERROR"}
                  </div>

                  <div
                    className={
                      styles.errorBody
                    }
                  >
                    <div
                      className={
                        styles.errorIcon
                      }
                    >
                      !
                    </div>

                    <div>
                      <strong>
                        {
                          error.message
                        }
                      </strong>

                      <p>
                        {faultMode
                          ? "THIS WILL NOT GO AWAY."
                          : "AN UNEXPECTED ERROR HAS OCCURRED."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.errorButton
                    }
                    onClick={() =>
                      dismissError(
                        error.id
                      )
                    }
                  >
                    OK
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {warningOpen && (
          <div
            className={
              styles.warningOverlay
            }
          >
            <div
              className={
                styles.warningBox
              }
              role="dialog"
              aria-modal="true"
              aria-labelledby="photosensitivity-warning"
            >
              <h1 id="photosensitivity-warning">
                PHOTOSENSITIVITY WARNING
              </h1>

              <p>
                THIS EXPERIENCE CONTAINS FLASHING LIGHTS, FLICKER, HIGH-CONTRAST
                IMAGES, AND RAPIDLY APPEARING WINDOWS.
              </p>

              <p>
                PLEASE TAKE CARE OF YOURSELF BEFORE CONTINUING.
              </p>

              <button
                type="button"
                className={
                  styles.warningButton
                }
                onClick={() =>
                  setWarningOpen(
                    false
                  )
                }
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
