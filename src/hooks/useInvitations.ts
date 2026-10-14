import {useContext} from 'react';
import {InvitationContext} from '../context/invitation';
export function useInvitations(){return useContext(InvitationContext)}
