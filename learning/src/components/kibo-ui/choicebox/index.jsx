"use client";;
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { createContext, useContext } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";

export const Choicebox = ({
  className,
  ...props
}) => (
  <RadioGroup className={cn("w-full", className)} {...props} />
);

const ChoiceboxItemContext = createContext(null);

const useChoiceboxItemContext = () => {
  const context = useContext(ChoiceboxItemContext);

  if (!context) {
    throw new Error(
      "useChoiceboxItemContext must be used within a ChoiceboxItem"
    );
  }

  return context;
};

export const ChoiceboxItem = ({
  className,
  children,
  value,
  id
}) => (
  <ChoiceboxItemContext.Provider value={{ value, id }}>
    <FieldLabel htmlFor={id}>
      <Field className={className} orientation="horizontal">
        {children}
      </Field>
    </FieldLabel>
  </ChoiceboxItemContext.Provider>
);

export const ChoiceboxItemHeader = ({
  className,
  ...props
}) => (
  <FieldContent className={className} {...props} />
);

export const ChoiceboxItemTitle = ({
  className,
  ...props
}) => <FieldTitle className={className} {...props} />;

export const ChoiceboxItemSubtitle = ({
  className,
  ...props
}) => (
  <span
    className={cn("font-normal text-muted-foreground text-xs", className)}
    {...props}
  />
);

export const ChoiceboxItemDescription = ({
  className,
  ...props
}) => (
  <FieldDescription className={className} {...props} />
);

export const ChoiceboxIndicator = (props) => {
  const context = useChoiceboxItemContext();

  return <RadioGroupItem {...props} value={context.value} />;
};
