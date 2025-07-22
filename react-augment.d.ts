/// <reference types="react" />
import * as React from 'react';

declare module 'react' {
  // Fix for React 19 useState issue
  function useState<S>(
    initialState: S | (() => S)
  ): [S, React.Dispatch<React.SetStateAction<S>>];
  
  function useState<S = undefined>(): [
    S | undefined,
    React.Dispatch<React.SetStateAction<S | undefined>>
  ];
}
