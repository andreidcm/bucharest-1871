/* eslint-disable react/forbid-dom-props */
// @flow

const debug = require("debug")("Bucharest1871:UIGrid")

import * as React from "react"
import cx from "classnames"
import { throttle, map, isEmpty } from "@asd14/m"

import { UIDebug } from "../debug/debug"
import { UIMarker } from "../marker/marker"

import css from "./grid.css"

type PropsType = {|
  className?: string,
  markers: {
    id: string,
    name: string,
    left: number,
    top: number,
  }[],
  markersSelectedId?: string,
  mapURL: string,
  width: number,
  height: number,
  hasLabels?: boolean,
  onMarkerClick?: Function,
  onMapClick?: Function,
|}

type StateType = {
  screenX: number,
  screenY: number,
  startX: number,
  startY: number,
  offsetX: number,
  offsetY: number,
  isPanning: boolean,
}

class UIGrid extends React.Component<PropsType, StateType> {
  static defaultProps = {
    className: undefined,
    markersSelectedId: undefined,
    hasLabels: false,
    onMarkerClick: undefined,
    onMapClick: undefined,
  }

  state = {
    screenX: 0,
    screenY: 0,
    startX: 0,
    startY: 0,
    offsetX: -3700,
    offsetY: -800,
    isPanning: false,
  }

  /**
   * The constructor for a React component is called before it is mounted.
   * When implementing the constructor for a React.Component subclass, you
   * should call super(props) before any other statement. Otherwise,
   * this.props will be undefined in the constructor, which can lead to bugs.
   *
   * DO
   *    - set initial state
   *    - if not using class properties syntax—prepare all class fields and
   *    bind functions that will be passed as callbacks
   *
   * DON'T
   *    - cause any side effects (AJAX calls etc.)
   *
   * @param {Object}  props  The properties
   */
  constructor(props: PropsType) {
    super(props)

    this.handleThrottledDragMove = throttle(this.handleDragMove, {
      bind: this,
      timeWindow: 25,
      hasExecAfterStop: true,
    })
  }

  /**
   * When called, it should examine this.props and this.state and return a
   * single React element. This element can be either a representation of a
   * native DOM component, such as <div />, or another composite component
   * that you've defined yourself.
   *
   * @return {Component}
   */
  render = (): React.Node => {
    const {
      className,
      markers,
      markersSelectedId,
      mapURL,
      width,
      height,
      hasLabels,
    } = this.props
    const { offsetX, offsetY, screenX, screenY, isPanning } = this.state

    return (
      <div
        className={cx(css.grid, {
          [className || ""]: !isEmpty(className),
          [css["grid--is-panning"]]: isPanning,
        })}
        style={{
          backgroundImage: `url(${mapURL})`,
          backgroundPositionX: offsetX,
          backgroundPositionY: offsetY,
        }}
        onClick={this.handleMapClick}
        onMouseDown={this.handleDragStart}
        onMouseMove={this.handleThrottledDragMove}
        onMouseUp={this.handleDragEnd}>
        <div
          className={css["grid-content"]}
          style={{
            width,
            height,
            left: offsetX,
            top: offsetY,
          }}>
          {map(
            ({ id, label, left, top }, index): React.Node => (
              <UIMarker
                key={`marker-${index}`}
                label={label}
                left={left}
                top={top}
                isActive={id === markersSelectedId}
                hasLabelVisible={hasLabels}
                onClick={this.handleMarkerClick(id)}
              />
            )
          )(markers)}
        </div>
        {false && (
          <UIDebug
            dump={{
              offset: { X: offsetX, Y: offsetY },
              screen: { X: screenX, Y: screenY },
              map: {
                width,
                height,
                X: screenX + Math.abs(offsetX),
                Y: screenY + Math.abs(offsetY),
              },
              isPanning,
            }}
          />
        )}
      </div>
    )
  }

  handleMapClick = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    const { onMapClick } = this.props
    const { offsetX, offsetY } = this.state

    if (onMapClick) {
      onMapClick(
        {
          latitude: Math.abs(offsetX) + event.clientX,
          longitude: Math.abs(offsetY) + event.clientY,
        },
        event
      )
    }
  }

  /**
   * Run parent onMarkerClick when marker is clicked
   *
   * @param {string} id  POI id
   *
   * @return {undefined}
   */
  handleMarkerClick = (id: string): Function => (
    event: SyntheticMouseEvent<HTMLDivElement>
  ) => {
    const { onMarkerClick } = this.props

    // dont allow markerclick to also trigger grid.click
    event.stopPropagation()

    if (onMarkerClick) {
      onMarkerClick(id)
    }
  }

  /**
   * Enable panning flag and save current position of mouse when clicking on
   * map
   *
   * @param  {Object}  event  The event synthetic mouse event html div element
   *
   * @return {undefined}
   */
  handleDragStart = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    event.stopPropagation()

    const currentMouseX = event.clientX
    const currentMouseY = event.clientY

    this.setState(
      ({ offsetX, offsetY }: StateType): Object => ({
        startX: currentMouseX - offsetX,
        startY: currentMouseY - offsetY,
        isPanning: true,
      })
    )
  }

  handleThrottledDragMove = null

  /**
   * Pan image using initial mouse position (when drag started) and current
   * mouse position
   *
   * @param  {Object}  event  The event synthetic mouse event html div element
   *
   * @return {undefined}
   */
  handleDragMove = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    const { startX, startY, isPanning } = this.state

    this.setState({
      screenX: event.clientX,
      screenY: event.clientY,
    })

    if (isPanning) {
      const offsetX = event.clientX - startX
      const offsetY = event.clientY - startY

      const isLeftTooFarLeft = offsetX > 0
      const isTopTooFarTop = offsetY > 0

      this.setState({
        offsetX: isLeftTooFarLeft ? 0 : offsetX,
        offsetY: isTopTooFarTop ? 0 : offsetY,
      })
    }
  }

  /**
   * Disable panning flag
   *
   * @return {undefined}
   */
  handleDragEnd = () => {
    const { isPanning } = this.state

    if (isPanning) {
      this.setState({
        isPanning: false,
      })
    }
  }
}

export { UIGrid }
