import { assign, sendParent, createMachine } from 'xstate';
import { ZodTypeAny } from 'zod';

type Context = {
  value?: any;
  __firstRun: boolean;
};

type States = {
  value: 'idle';
  // | 'validating';
  context: Context;
};

type Events =
  | { id: string; type: 'FAIL' | 'SUCCESS' }
  | { type: 'VALIDATE'; value: any };

export const actor = ({
  id,
  validator,
}: {
  id: string;
  validator: ZodTypeAny;
}) => {
  return createMachine<Context, Events, States>(
    {
      initial: 'idle',

      context: {
        __firstRun: true,
      },

      invoke: {
        src: 'validate',
        onDone: {
          target: 'idle',
          cond: 'notFirstRun',
          actions: 'sendSuccess',
        },
        onError: {
          target: 'idle',
          cond: 'notFirstRun',
          actions: 'sendFail',
        },
      },

      states: {
        idle: {
          entry: assign({
            __firstRun: (_) => false,
          }),

          on: {
            VALIDATE: {
              actions: 'setValue',
              target: 'validating',
            },
          },
        },

        // validating: {
        //   on: {
        //     VALIDATE: {
        //       internal: false,
        //       actions: 'setValue',
        //       target: 'validating',
        //     },
        //   },

        //   invoke: {
        //     src: 'validate',
        //     onDone: {
        //       target: 'idle',
        //       actions: 'sendSuccess',
        //     },
        //     onError: {
        //       target: 'idle',
        //       actions: 'sendFail',
        //     },
        //   },
        // },
      },
    },
    {
      guards: {
        notFirstRun: ({ __firstRun }) => !__firstRun,
      },

      actions: {
        setValue: assign({
          value: (_, { value }: any) => value,
        }),

        sendFail: sendParent((_, { data }: any) => {
          return { id, type: 'FAIL', reason: data };
        }),

        sendSuccess: sendParent((_) => {
          return { id, type: 'SUCCESS' };
        }),
      },

      services: {
        validate: ({ value, __firstRun }) =>
          __firstRun ? Promise.resolve() : validator.parseAsync(value),
      },
    }
  );
};