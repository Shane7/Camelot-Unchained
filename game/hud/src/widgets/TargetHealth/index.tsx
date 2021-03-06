/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as React from 'react';
import {createStore, applyMiddleware} from 'redux';
import {Provider, connect} from 'react-redux';
const thunk = require('redux-thunk').default;
import {WarbandMember, archetype, race, gender, hasClientAPI} from 'camelot-unchained';

import PlayerStatusComponent from '../../components/PlayerStatusComponent';
import reducer, {SessionState} from './services/session';
import {TargetState, DoThing, initializePlayerSession} from './services/session/target';
import {PlayerStatus, BodyParts} from '../../lib/PlayerStatus';

const store = createStore(reducer, applyMiddleware(thunk));


export interface ContainerProps {
  containerClass?: string;
  isMini?: boolean;
}

export interface TargetHealthProps extends ContainerProps {
  dispatch?: (action: any) => any;
  player?: TargetState;
}

export interface TargetHealthState {
}

function select(state: SessionState): TargetHealthProps {
  return {
    player: state.player
  }
}

class TargetHealth extends React.Component<TargetHealthProps, TargetHealthState> {

  constructor(props: TargetHealthProps) {
    super(props);
  }

  componentDidMount() {
    this.props.dispatch(initializePlayerSession());
  }

  render() {

    const hide = this.props.player.playerStatus.name == '';
    if (hide) return null;

    const dead = this.props.player.playerStatus.blood.current <= 0 || this.props.player.playerStatus.health[BodyParts.Torso].current <= 0;
    return (
      <div className={`player-health ${this.props.containerClass}`} onClick={() =>  hasClientAPI() || dead ? '' : this.props.dispatch(DoThing())}>
        <PlayerStatusComponent containerClass='TargetHealth' mirror={true} playerStatus={this.props.player.playerStatus} events={this.props.player.events}/>
      </div>
    );
  }
}

const TargetComp = connect(select)(TargetHealth);

class Container extends React.Component<ContainerProps,{}> {
  render() {
    return (
      <Provider store={store}>
        <TargetComp {...this.props}/>
      </Provider>
    )
  }
}

export default Container;
