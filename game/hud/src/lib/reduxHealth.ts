/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @Author: JB (jb@codecorsair.com)
 * @Date: 2016-08-30 14:26:25
 * @Last Modified by: JB (jb@codecorsair.com)
 * @Last Modified time: 2016-08-30 14:50:12
 */
import {race, gender, archetype, faction, Player} from 'camelot-unchained';

import {PlayerStatus, BodyParts} from './PlayerStatus';
import {clone, BaseAction} from './reduxUtils';

export interface HealthAction extends BaseAction {
  current?: number;
  max?: number;
  part?: BodyParts;
  text?: string;
  race?: race;
  faction?: faction;
  player?: Player;
}

export function fakePlayer(): PlayerStatus {
  return {
    name: 'CSE-JB',
    avatar: 'http://camelotunchained.com/upload/jb.png',
    race: race.HUMANMALEV,
    gender: gender.MALE,
    archetype: archetype.WINTERSSHADOW,
    characterID: '',
    health: [{
      current: 10000,
      maximum: 10000,
    },{
      current: 10000,
      maximum: 10000,
    },{
      current: 10000,
      maximum: 10000,
    },{
      current: 10000,
      maximum: 10000,
    },{
      current: 10000,
      maximum: 10000,
    },{
      current: 10000,
      maximum: 10000,
    }],
    wounds: [0, 0, 0, 0, 0, 0],
    stamina: {
      current: 1000,
      maximum: 2000
    },
    blood: {
      current: 15000,
      maximum: 15000
    },
    panic: {
      current: 1,
      maximum: 3
    },
    temperature: {
      current: 50,
      freezingThreshold: 0,
      burningThreshold: 100
    }
  }
}

export function fakeHealthEvents() {
  return [{
    key: 0,
    value: '1000',
    textType: 'damage',
    iconType: 'slashing',
    timestamp: Date.now(),
  },{
    key: 1,
    value: '500',
    textType: 'damage',
    iconType: 'slashing',
    timestamp: Date.now(),
  },{
    key: 2,
    value: '1000',
    textType: 'heal',
    iconType: 'spirit',
    timestamp: Date.now(),
  }];
}

export function staminaUpdated(status: PlayerStatus, action: HealthAction) {
  let playerStatus = clone(status);
  playerStatus.stamina.current = action.current;
  playerStatus.stamina.maximum = action.max;
  return {playerStatus: playerStatus};
}

export function healthUpdated(status: PlayerStatus, action: HealthAction) {
  let playerStatus = clone(status);
  playerStatus.health[action.part].current = action.current;
  playerStatus.health[action.part].maximum = action.max;
  return {playerStatus: playerStatus};
}

export function nameChanged(status: PlayerStatus, action: HealthAction) {
  let playerStatus = clone(status);
  playerStatus.name = action.text;
  return {playerStatus: playerStatus};
}

export function raceChanged(status: PlayerStatus, action: HealthAction) {
  let playerStatus = clone(status);
  playerStatus.race = action.race;
  return {playerStatus: playerStatus};
}

let key = 3;
export function playerUpdate(status: PlayerStatus, events: any[], action: HealthAction) {
  
  const doEvent = false && status.name == action.player.name;
  
  let playerStatus = clone(status);
  playerStatus.name = action.player.name;
  playerStatus.archetype = action.player.archetype;
  playerStatus.race = action.player.race;
  playerStatus.stamina.current = action.player.stamina;
  playerStatus.stamina.maximum = action.player.maxStamina;
  playerStatus.blood.current = action.player.health; // this is blood not health!
  playerStatus.blood.maximum = action.player.maxHealth > 0 ? action.player.maxHealth : 10000;
  
  // make an event -- hacky for now
  let index = 0;
  let now = Date.now();
  for (; index < events.length; ++index) {
    if (now - events[index].timestamp < 1000) break;
  }
  
  var newEvents = events.slice(index);
  action.player.injuries.forEach(e => {
    const valueChange = playerStatus.health[e.part].current - e.health;
    playerStatus.health[e.part].current = e.health;
    playerStatus.health[e.part].maximum = e.maxHealth > 0 ? e.maxHealth : 10000;
    playerStatus.wounds[e.part] = e.wounds;
    
    if (!doEvent) return;
    
    if (valueChange > 0) {
      // damage event!
      newEvents.push({
        key: key++,
        value: Math.abs(valueChange).toFixed(0),
        timestamp: now,
        textType: 'damage',
        iconType: 'piercing',
      });
    } else if (valueChange < 0) {
      // heal event!
      newEvents.push({
        key: key++,
        value: Math.abs(valueChange).toFixed(0),
        timestamp: now,
        textType: 'heal',
        iconType: 'heal',
      });
    }
  });

  return {
    playerStatus: playerStatus,
    events: newEvents
  };
}

export function healtEmulationTest(status: PlayerStatus, events: any[], action: HealthAction) {
  // clean out any old events
  let index = 0;
  let now = Date.now();
  
  for (; index < events.length; ++index) {
    if (now - events[index].timestamp < 1000) break;
  }

  var newEvents = events.slice(index);
  let damage  = Math.random() * 2 > .5;
  const e = {
    key: key++,
    value: (Math.random()*2000 + 750).toFixed(0),
    timestamp: now,
    textType: damage ? 'damage' : 'heal',
    iconType: damage ? 'piercing' : 'heal',
  };
  newEvents.push(e);
  
  let playerStatus = clone(status);
  const part = parseInt((Math.random() * 5).toFixed(0));
  
  if (damage) {
    playerStatus.health[part].current = playerStatus.health[part].current - parseInt(e.value);
  } else {
    playerStatus.health[part].current = playerStatus.health[part].current + parseInt(e.value);
  }
  
  // range check
  if (playerStatus.health[part].current > playerStatus.health[part].maximum) playerStatus.health[part].current = playerStatus.health[part].maximum;
  if (playerStatus.health[part].current < 0) playerStatus.health[part].current = 0;
  
  // Rubbish wounds emulation
  let wounds = playerStatus.wounds[part] + (1 - ((Math.random() * 3)|0));
  if (wounds < 0) wounds = 0;
  if (wounds > 3) wounds = 3;
  playerStatus.wounds[part] = wounds;
  
  if (wounds === 1 && playerStatus.health[part].current > 666) {
    playerStatus.health[part].current = 666;
  }
  
  if (wounds === 2 && playerStatus.health[part].current > 333) {
    playerStatus.health[part].current = 333;
  }
  
  if (wounds === 3) {
    playerStatus.health[part].current = 0;
  }
  
  return {
    events: newEvents,
    playerStatus: playerStatus,
  };
}
