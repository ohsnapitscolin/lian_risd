import React, { useEffect, useRef, useState, useCallback } from "react";
import ambience from "../audio/base.wav";
import meadow from "../audio/meadow.wav";
import styled, { createGlobalStyle } from "styled-components";
import Sky from "../components/Sky";
import Blinds from "../components/Blinds";
import SunCalc from "../utils/suncalc";
import Stars from "../components/Stars";
import Draggable from "react-draggable";
import { Howl } from "howler";

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

// const WindowShadow = styled.div`
//   widthL 100%;
//   height: 100%;
//   position: absolute;
//   left: 0;
//   right: 0;
//   top: 0;
//   bottom: 0;
//   margin: auto;
//   box-shadow: inset -2px -2px 50px #ffffff, inset 12px 12px 15px black;
// `;

const Sun = styled.div`
  height: 0;
  width: 80%;
  padding-bottom: 80%;
  background: linear-gradient(360deg, rgba(255, 255, 255, 0) 0%, #fffbd2 100%);
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
  left: 0;
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

const ambienceHowl = new Howl({
  src: [ambience],
  loop: true,
});

const meadowHowl = new Howl({
  src: [meadow],
  loop: true,
});

const otherHowl = new Howl({
  src: [meadow],
  html5: true,
  loop: true,
});

const Content = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`;

export default function Circadian() {
  const [slide, setSlide] = useState(0);
  const [date, setDate] = useState(new Date());

  const [moment, setMoment] = useState(null);
  const [momentProgress, setMomentProgress] = useState(null);
  const [skyProgress, setSkyProgress] = useState(null);

  const [entered, setEntered] = useState(false);

  const sun = useRef();

  const requestRef = useRef();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        sun.current = new SunCalc(coords.latitude, coords.longitude);
      },
      () => {
        sun.current = new SunCalc(41.82399, -71.412834);
      }
    );
  }, []);

  const tick = useCallback(() => {
    if (!sun.current) return;
    sun.current.tick();
    setSkyProgress(sun.current.getTotalProgress());
    setMomentProgress(sun.current.getMomentProgress());
    setMoment(sun.current.getMoment());
    setDate(sun.current.date);
    requestRef.current = requestAnimationFrame(tick);
  });

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [tick]); // Make sure the effect runs only once

  useEffect(() => {
    otherHowl.volume(1 - slide / 100);
    ambienceHowl.volume(1 - slide / 100);
  }, [slide]);

  const playAll = () => {
    otherHowl.play();
    ambienceHowl.play();
  };

  const drag = (e, data) => {
    if (!e.target.className.includes("react-draggable")) return;
    const height = e.target.getBoundingClientRect().height;
    const offset = height / 3;
    const percent = data.y / offset;
    setSlide((1 - percent) * 100);
  };

  const handleEnter = () => {
    setEntered(true);
    playAll();
  };

  return (
    <>
      <BodyStyle />
      <Wall />

      {!entered && <button onClick={handleEnter}>Enter</button>}
      {entered && (
        <>
          {/* <Light slide={slide} /> */}
          {/* <p>
            {date.toString()} {Math.round(skyProgress, 2)}{" "}
            {Math.round(momentProgress * 100, 2)} {moment?.current.name}{" "}
            {moment?.next.name}
          </p> */}
          <Window slide={slide}>
            <WindowContent>
              <Sky progress={skyProgress} />
              <Sun />
              {/* <Stars /> */}
              <Blinds
                slide={slide}
                moment={moment}
                momentProgress={momentProgress}
              />
            </WindowContent>

            <DragContainer>
              <Draggable name="drag" axis={"y"} bounds="parent" onDrag={drag}>
                <Overlay />
              </Draggable>
            </DragContainer>
          </Window>

          {/* <Content>
            <button onClick={play}>Play</button>
            <button onClick={pause}>Pause</button>
          </Content> */}
        </>
      )}
    </>
  );
}
