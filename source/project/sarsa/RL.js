class RL {
    constructor(
        action_space, 
        learning_rate = 0.01, 
        reward_decay = 0.9, 
        e_greedy = 0.9) {
        this.actions = action_space;
        this.learning_rate = learning_rate;
        this.gamma = reward_decay;
        this.epsilon = e_greedy;
        this.q_table = {};
        this.createArray = function(n) {
            let array = [];
            array.length = n;
            array.fill(0);
            return array;
        }
    }

    check_state_exist(state) {
        if (!this.q_table[state]) {
            this.q_table[state] = this.createArray(this.actions.length);
        }    
    }

    choose_action(observation) {
        let action = null;
        this.check_state_exist(observation);
        if (Math.random() < this.epsilon) {
            let state_action = this.q_table[observation];
            let id = 0, max = -Infinity;
            for (let i=0; i < state_action.length; ++i) {
                let action_rewards = state_action[i];
                if (action_rewards > max) {
                    max = action_rewards;
                    id = i;
                }
            }
            action = this.actions[id];
        } else {
            action = this.actions[parseInt(Math.random() * this.actions.length)];
        }
        return action;
    }
}

class QLearningTable extends RL {
    constructor(
        action_space, 
        learning_rate = 0.01, 
        reward_decay = 0.9, 
        e_greedy = 0.9) {
        super(action_space, learning_rate, reward_decay, e_greedy);
    }

    learn() {
        
    }
}

class SarsaLamdaTable extends RL {
    constructor(
        action_space, 
        learning_rate = 0.01, 
        reward_decay = 0.9, 
        e_greedy = 0.9) {
        super(action_space, learning_rate, reward_decay, e_greedy);
    }

    learn(s,a,r,s_,a_) {
        this.check_state_exist(s_);
        let q_predict = this.q_table[s][a], q_target = 0;
        if (s_ != 'terminal') {
            q_target = r + this.gamma * this.q_table[s_][a_];
        } else {
            q_target = r;
        }
        this.q_table[s][a] += this.learning_rate * (q_target - q_predict);
    }
}