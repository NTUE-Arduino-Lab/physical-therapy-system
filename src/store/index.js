import { createContext, useReducer, useContext } from 'react';
import PropTypes from 'prop-types';
import { SET_AUTH } from './actions';

import { ROLES } from '../constants';

const StoreContext = createContext();

const initialState = {
    auth: {
        isValid: true,
        roles: [ROLES.Admin], // 1984: Editor ; 5150: Admin
    },
};

const reducer = (state, action) => {
    switch (action.type) {
        case SET_AUTH:
            return {
                ...state,
                auth: {
                    ...action.payload,
                },
            };
        default:
            return state;
    }
};

const StoreProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const value = { state, dispatch };

    return (
        <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    );
};

const useStore = () => {
    return useContext(StoreContext);

    // Used as custom-hook;
    // const store = useStore();
    //
    // console.log(store)
    // OUTPUT:
    // {state: {…}, dispatch: ƒ}
};

StoreProvider.propTypes = {
    children: PropTypes.object,
};

export { StoreProvider, StoreContext, useStore };
