import React, { useState, useRef } from "react"
import { useStateView } from "../hooks/useStateView"
import { URLRule } from "../types"
import { ThrottledTextInput } from "../comps/ThrottledTextInput"
import { GoX, GoZap } from "react-icons/go"
import { getDefaultURLRule, getDefaultFx } from "../defaults"
import { FaPowerOff } from "react-icons/fa"
import { NumericInput } from "../comps/NumericInput"
import { FxControl } from "../popup/FxControl"
import { moveItem } from "../utils/helper"
import { Move } from "../comps/Move"
import "./SectionRules.scss"
import produce from "immer"


export function SectionRules(props: {}) {
  const [view, setView] = useStateView({rules: true})
  if (!view) return <div></div>

  const rules = view.rules || []

  const handleChange = (newRule: URLRule, remove?: boolean) => {
    setView({
      rules: produce(rules, d => {
        const idx = d.findIndex(v => v.id === newRule.id)
        if (remove) {
          if (idx < 0) return 
          d.splice(idx, 1)
          return 
        }

        if (idx >= 0) {
          d[idx] = newRule
        } else {
          d.push(newRule)
        }
      })
    })
  }

  const handleMove = (id: string, down: boolean) => {
    setView({rules: produce(rules, d => {
      moveItem(d, v => v.id === id, down)
    })})
  }

  return (
    <div className="section SectionRules">
      <h2>{window.gsm.options.rules.header}</h2>
      {rules.length > 0 && (
        <div className="dict">
          <div>
            <div style={{fontWeight: "bolder", fontSize: "1.2em"}}>ILO:</div>
            <div>{window.gsm.options.rules.ILO}</div>
          </div>
          <div>
            <div style={{fontWeight: "bolder", fontSize: "1.2em"}}>LAX:</div>
            <div>{window.gsm.options.rules.LAX}</div>
          </div>
        </div>
      )}
      <div className="rules">{rules.map((rule, i) => (
        <Rule key={rule.id} rule={rule} onChange={handleChange} onMove={handleMove}/>
      ))}</div>
      <button className="create" onClick={e => {
        handleChange(getDefaultURLRule())
      }}>{window.gsm.token.create}</button>
    </div>
  )
}



type RuleProps = {
  rule: URLRule,
  onChange: (rule: URLRule, remove?: boolean) => void,
  onMove: (id: string, down?: boolean) => void
}

function Rule(props: RuleProps) {
  const { rule, onChange } = props
  return (
    <div className="Rule">
      <Move onMove={down => {
        props.onMove(rule.id, down)
      }}/>
      <input type="checkbox" checked={!!rule.enabled} onChange={e => {
        onChange(produce(rule, d => {
          d.enabled = !d.enabled
        }))
      }}/>
      <button className={`toggle ${rule.initialLoadOnly ? "active" : ""}`} onClick={e => {
        onChange(produce(rule, d => {
          d.initialLoadOnly = !d.initialLoadOnly
        }))
      }}>ILO</button>
      <button className={`toggle ${rule.strict ? "" : "active"}`} onClick={e => {
        onChange(produce(rule, d => {
          d.strict = !d.strict
        }))
      }}>LAX</button>
      <select value={rule.matchType} onChange={e => {
        onChange(produce(rule, d => {
          d.matchType = e.target.value as any
          if (d.matchType === "REGEX") {
            d.match = String.raw`twitch\.tv`
          } else if (d.matchType === "CONTAINS") {
            d.match = "twitch.tv"
          } else if (d.matchType === "STARTS_WITH") {
            d.match = String.raw`https://www.twitch.tv`
          }
        }))
      }}>
        <option value={"STARTS_WITH"}>{window.gsm.options.rules.startsWith}</option>
        <option value={"CONTAINS"}>{window.gsm.options.rules.contains}</option>
        <option value={"REGEX"}>{window.gsm.options.rules.regex}</option>
      </select>
      <ThrottledTextInput value={rule.match} onChange={newValue => {
        onChange(produce(rule, d => {
          d.match = newValue
        }))
      }}/>
      <select value={rule.type} onChange={e => {
         onChange(produce(rule, d => {
          d.type = e.target.value as any
        }))
      }}>
        <option value="STATE">{window.gsm.command.setState}</option>
        <option value="SPEED">{window.gsm.command.adjustSpeed}</option>
        <option value="FX">{window.gsm.command.adjustFilter}</option>
      </select>
      {rule.type == "STATE" && (
        <button onClick={e => {
          onChange(produce(rule, d => {
            d.overrideEnabled = !d.overrideEnabled
          }))
        }}>{<FaPowerOff className={`icon ${rule.overrideEnabled ? "active" : ""}`} size="17px"/>}</button>
      )}
      {rule.type == "SPEED" && (
        <NumericInput noNull={true} min={1 / 16} max={16} value={rule.overrideSpeed ?? 1} onChange={v => {
          onChange(produce(rule, d => {
            d.overrideSpeed = v
          }))
        }}/>
      )}
      {rule.type == "FX" && (
        <FxRuleControl rule={rule} onChange={onChange}/>
      )}
      <button className="close icon" onClick={e => props.onChange(rule, true)}>
        <GoX size="23px"/>
      </button>
    </div>
  )
}

type FxRuleControlProps = {
  rule: URLRule,
  onChange: (rule: URLRule, remove?: boolean) => void
}

function FxRuleControl(props: FxRuleControlProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>()

  let { overrideFx } = props.rule 
  if (!overrideFx) {
    const fx = getDefaultFx()
    overrideFx = {
      elementFx: fx,
      backdropFx: fx
    }
  }

  return <div className="FxControlButton">
    <button onClick={e => {
      setOpen(!open)
    }}>{<GoZap className="icon active" size="20px"/>}</button>
    {open && (
      <div ref={wrapperRef} className="wrapper" onClick={e => {
        if (e.target === wrapperRef.current) setOpen(false)
      }}>
        <FxControl enabled={true} elementFx={overrideFx.elementFx} backdropFx={overrideFx.backdropFx} swapFx={() => {
          props.onChange(produce(props.rule, d => {
            d.overrideFx = d.overrideFx ?? overrideFx;
            [d.overrideFx.backdropFx, d.overrideFx.elementFx] = [d.overrideFx.elementFx, d.overrideFx.backdropFx]
          }))
        }} handleFxChange={(backdrop, newFx) => {
          props.onChange(produce(props.rule, d => {
            d.overrideFx = d.overrideFx ?? overrideFx;
            d.overrideFx[backdrop ? "backdropFx" : "elementFx"] = newFx
          }))
        }}/>
      </div>
    )}
  </div>
}