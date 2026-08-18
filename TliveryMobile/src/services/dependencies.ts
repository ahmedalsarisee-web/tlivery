import {FirebaseAuthService} from '@app/firebase/auth/FirebaseAuthService';
import {FirebaseAuthRepository} from '@app/repositories/FirebaseAuthRepository';
import {AuthService} from './AuthService';
import {WorkflowCallableAdapter} from '@app/firebase/functions/WorkflowCallableAdapter';
import {FirebaseWorkflowRepository} from '@app/repositories/FirebaseWorkflowRepository';
import {WorkflowService} from './WorkflowService';

const firebaseAuthService = new FirebaseAuthService();
const authRepository = new FirebaseAuthRepository(firebaseAuthService);
const workflowRepository = new FirebaseWorkflowRepository();
const workflowCallables = new WorkflowCallableAdapter();

export const services = Object.freeze({
  auth: new AuthService(authRepository),
  workflow: new WorkflowService(workflowRepository, workflowCallables),
});
