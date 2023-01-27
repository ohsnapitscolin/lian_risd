import React, { useEffect, useRef, useState, useCallback } from "react";

import styled, { createGlobalStyle } from "styled-components";
import Sky from "../components/Sky";
import Blinds from "../components/Blinds";
import sunCalc from "../services/suncalc";
import audio from "../services/audio";
import Draggable from "react-draggable";
import { progress } from "../utils/math";
import Star from "../svg/star.svg";

import "../style/index.css";

const BodyStyle = createGlobalStyle`
  body {
    color: white;
    background-color: black !important;
    padding: 0 !important;
  }
`;

const Wall = styled.div`
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;
  background-color: #f6f7ef;
  opacity: 1;
  z-index: -2;
`;

const Light = styled.div`
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;
  background-color: #011d41;
  opacity: ${({ slide }) => slide / 100};
  z-index: -1;
`;

const Window = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  // box-shadow: 0 0 ${(p) => 100 - p.slide}px ${(p) =>
    100 - p.slide}px #fffbd2;

  // border-radius: 16px;
  overflow: hidden;
`;

const WindowContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

const Sun = styled.div.attrs((p) => ({
  style: {
    width: `${p.progress}%`,
    paddingBottom: `${p.progress}%`,
  },
}))`
  height: 0;
  background: linear-gradient(180deg, #f9ffac 0%, rgba(249, 255, 172, 0) 100%);
  border-radius: 50%;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
`;

const DragContainer = styled.div`
  width: 100%;
  height: 200%;
  position: absolute;
  bottom: 0;
  top: 50%;
  transform: translate(0, -50%);
  overflow: hidden;
`;

const Overlay = styled.div`
  width: 100%;
  height: 75%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: grab;
`;

const Watts = styled.div`
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translate(-50%, 0);
  color: inherit;

  display: flex;
  align-items: center;
`;

const WattsContent = styled.div`
  position: relative;
  span {
    position: absolute;

    &:nth-of-type(1) {
      top: 50%;
      transform: translate(0, -50%);
      right: 100%;
    }
    &:nth-of-type(2) {
      top: 50%;
      transform: translate(0, -50%);
      left: 100%;
    }
  }
`;

const WattsStar = styled(Star)`
  path {
    fill: ${(p) => p.color};
    transition: path 0.5s ease;
  }
  margin: 0 5px;
`;

const UI = styled.div`
  color: ${(p) => p.color};
  font-size: 18px;
  transition: color 0.5s ease;
`;

const Mute = styled.button`
  position: absolute;
  bottom: 25px;
  left: 30px;
  appearance: none;
  background: none;
  border: 0;
  cursor: pointer;
  font-size: inherit;
  color: inherit;
`;

const About = styled.button`
  position: absolute;
  bottom: 25px;
  right: 30px;
  appearance: none;
  background: none;
  border: 0;
  font-size: inherit;
  color: inherit;
`;

const Info = styled.p`
  position: absolute;
  top: 0;
  left: 20px;
`;

export default function Circadian() {
  const [slide, setSlide] = useState(0);

  const [moment, setMoment] = useState({});
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [info, setInfo] = useState(false);

  const prevHour = useRef();
  const requestRef = useRef();

  useEffect(async () => {
    const params = new URLSearchParams(window.location.search);
    let date = params.get("d");
    let speed = params.get("s");
    const latitude = params.get("lat");
    const longitude = params.get("lon");

    setInfo(params.get("i"));

    let coords;
    if (latitude && longitude) {
      coords = {
        latitude,
        longitude,
      };
    }

    if (date) date = new Date(date);
    if (speed) speed = Number(speed);

    sunCalc.initialize(speed, date, coords);
    audio.initialize(() => {
      console.log("audio loaded");
    });
  }, []);

  useEffect(() => {
    console.log(moment.song);
  }, [moment.song]);

  const currHour = moment.hour ?? null;
  useEffect(() => {
    if (prevHour.current != null && currHour != null) {
      audio.chime();
    }
    prevHour.current = moment.hour;
  }, [moment.hour]);

  const tick = useCallback(() => {
    if (sunCalc.initialized) {
      sunCalc.tick();
      setMoment(sunCalc.getMoment());
    }
    requestRef.current = requestAnimationFrame(tick);
  });

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [tick]); // Make sure the effect runs only once

  useEffect(() => {
    audio.volume(1 - slide / 100);
  }, [slide]);

  const drag = (e, data) => {
    if (typeof e.target.className !== "string") return;
    if (!e.target.className.includes("react-draggable")) return;
    const height = e.target.getBoundingClientRect().height;
    const offset = height / 3;
    const percent = data.y / offset;
    setSlide(percent * 100);
  };

  const handleEnter = () => {
    setEntered(true);
    audio.play("ambience");
    setTimeout(() => {
      audio.fade("ambience", "meadow", 5000);
    }, 5000);
  };

  const mute = () => {
    audio.mute(!muted);
    setMuted(!muted);
  };

  return (
    <>
      <BodyStyle />
      <Wall />

      {!entered && <button onClick={handleEnter}>Enter</button>}
      {entered && moment.progress && (
        <>
          {/* <Light slide={slide} /> */}
          {info && (
            <Info>
              {moment.date.toString()}
              <br />
              sky: {(moment.skyProgress * 100).toFixed(0)}%
              <br />
              day: {(moment.dayProgress * 100).toFixed(0)}%
              <br />
              moment: {moment.current.name} → {moment.next.name}{" "}
              {Math.round(moment.progress * 100).toFixed(0)}%
              <br />
              song: {moment.song}
              <br />
              slide: {slide.toFixed(0)}%
            </Info>
          )}
          <Window slide={slide}>
            <WindowContent>
              <Sky progress={moment.skyProgress} />
              <Sun progress={progress(20, 80, moment.dayProgress, true)} />
              <Blinds
                slide={slide}
                moment={moment}
                momentProgress={moment.progress}
              />
            </WindowContent>

            <DragContainer>
              <Draggable name="drag" axis={"y"} bounds="parent" onDrag={drag}>
                <Overlay />
              </Draggable>
            </DragContainer>
          </Window>

          <UI color={moment.ui}>
            <Watts>
              <WattsContent>
                <WattsStar color={moment.ui} />
                <span>{moment.watts.toFixed(0)}</span>
                <span>Watts</span>
              </WattsContent>
            </Watts>
            <Mute onClick={mute}>Mute</Mute>
            <About>About</About>
          </UI>
          {/* <UI>
            <button onClick={play}>Play</button>
            <button onClick={pause}>Pause</button>
          </UI> */}
        </>
      )}
    </>
  );
}
