// app/components/shared/text-inputs.tsx
// Path: app/components/shared/text-inputs.tsx
// Unified text input components with enhanced features

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput as RNTextInput, 
  TouchableOpacity, 
  Animated,
  KeyboardTypeOptions,
  TextInputProps as RNTextInputProps,
  ActivityIndicator
} from 'react-native';
import { Search, X, Eye, EyeOff, AlertCircle, Check } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';

// ============================================
// Shared Types and Interfaces
// ============================================
interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
  inputStyle?: any;
}

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

// ============================================
// InputField Component (Enhanced from input-field.tsx)
// ============================================
interface InputFieldProps extends BaseInputProps, Omit<RNTextInputProps, 'style'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'phone' | 'url';
  showPasswordToggle?: boolean;
  validation?: ValidationRule[];
  onValidation?: (isValid: boolean) => void;
  animated?: boolean;
}

export function InputField({
  label,
  error,
  hint,
  required = false,
  disabled = false,
  type = 'text',
  showPasswordToggle = true,
  leftIcon,
  rightIcon,
  validation = [],
  onValidation,
  animated = true,
  containerStyle,
  inputStyle,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...textInputProps
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Determine keyboard type based on input type
  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (type) {
      case 'email': return 'email-address';
      case 'number': return 'numeric';
      case 'phone': return 'phone-pad';
      case 'url': return 'url';
      default: return 'default';
    }
  };

  // Handle focus animation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  // Validate input
  const validateInput = (text: string) => {
    if (validation.length > 0) {
      for (const rule of validation) {
        if (!rule.test(text)) {
          setValidationError(rule.message);
          onValidation?.(false);
          return;
        }
      }
    }
    setValidationError('');
    onValidation?.(true);
  };

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    validateInput(text);
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const displayError = error || validationError;

  // Animated label style
  const labelStyle = animated ? {
    position: 'absolute' as const,
    left: spacing.md,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [typography.base, typography.xs],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, colors.primary],
    }),
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xs,
  } : styles.staticLabel;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        animated ? (
          <Animated.Text style={labelStyle}>
            {label}{required && ' *'}
          </Animated.Text>
        ) : (
          <Text style={styles.staticLabel}>
            {label}{required && ' *'}
          </Text>
        )
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        displayError && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <RNTextInput
          {...textInputProps}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle,
          ]}
          editable={!disabled}
          secureTextEntry={type === 'password' && !showPassword}
          keyboardType={getKeyboardType()}
          placeholderTextColor={colors.textSecondary}
        />
        
        {type === 'password' && showPasswordToggle && (
          <TouchableOpacity 
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 
              <EyeOff size={20} color={colors.textSecondary} /> : 
              <Eye size={20} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        )}
        
        {rightIcon && type !== 'password' && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
      
      {hint && !displayError && (
        <Text style={styles.hint}>{hint}</Text>
      )}
      
      {displayError && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color={colors.error} />
          <Text style={styles.error}>{displayError}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// TextAreaField Component (Enhanced from text-area-field.tsx)
// ============================================
interface TextAreaFieldProps extends BaseInputProps, Omit<RNTextInputProps, 'style' | 'multiline'> {
  minHeight?: number;
  maxHeight?: number;
  showCharCount?: boolean;
  maxLength?: number;
  autoGrow?: boolean;
}

export function TextAreaField({
  label,
  error,
  hint,
  required = false,
  disabled = false,
  minHeight = 100,
  maxHeight = 200,
  showCharCount = true,
  maxLength,
  autoGrow = true,
  containerStyle,
  inputStyle,
  value = '',
  onChangeText,
  ...textInputProps
}: TextAreaFieldProps) {
  const [height, setHeight] = useState(minHeight);
  const charCount = value?.length || 0;

  const handleContentSizeChange = (event: any) => {
    if (autoGrow) {
      const contentHeight = event.nativeEvent.contentSize.height;
      setHeight(Math.min(Math.max(contentHeight, minHeight), maxHeight));
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.staticLabel}>
          {label}{required && ' *'}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        <RNTextInput
          {...textInputProps}
          value={value}
          onChangeText={onChangeText}
          onContentSizeChange={handleContentSizeChange}
          style={[
            styles.input,
            styles.textArea,
            { height: autoGrow ? height : minHeight },
            inputStyle,
          ]}
          multiline
          textAlignVertical="top"
          editable={!disabled}
          maxLength={maxLength}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      
      <View style={styles.bottomRow}>
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={14} color={colors.error} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
        
        {showCharCount && maxLength && (
          <Text style={[
            styles.charCount,
            charCount > maxLength * 0.9 && styles.charCountWarning
          ]}>
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================
// SearchField Component (Enhanced from search-field.tsx)
// ============================================
interface SearchFieldProps extends BaseInputProps, Omit<RNTextInputProps, 'style'> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  loading?: boolean;
  showClearButton?: boolean;
}

export function SearchField({
  error,
  hint,
  disabled = false,
  onSearch,
  onClear,
  debounceMs = 300,
  loading = false,
  showClearButton = true,
  containerStyle,
  inputStyle,
  value = '',
  onChangeText,
  placeholder = 'Search...',
  ...textInputProps
}: SearchFieldProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    setInternalValue(text);
    onChangeText?.(text);

    // Debounced search
    if (onSearch && debounceMs > 0) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onSearch(text);
      }, debounceMs);
    } else if (onSearch) {
      onSearch(text);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChangeText?.('');
    onClear?.();
    onSearch?.('');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.inputContainer,
        styles.searchContainer,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        <View style={styles.iconLeft}>
          <Search size={20} color={colors.textSecondary} />
        </View>
        
        <RNTextInput
          {...textInputProps}
          value={internalValue}
          onChangeText={handleChangeText}
          style={[
            styles.input,
            styles.inputWithLeftIcon,
            styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          editable={!disabled}
          returnKeyType="search"
          onSubmitEditing={() => onSearch?.(internalValue)}
        />
        
        {loading && (
          <View style={styles.iconRight}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        
        {!loading && showClearButton && internalValue.length > 0 && (
          <TouchableOpacity style={styles.iconRight} onPress={handleClear}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {hint && !error && (
        <Text style={styles.hint}>{hint}</Text>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// New: FloatingLabelInput (Material Design style)
// ============================================
export function FloatingLabelInput(props: InputFieldProps) {
  return <InputField {...props} animated={true} />;
}

// ============================================
// New: ValidatedInput with common validations
// ============================================
interface ValidatedInputProps extends InputFieldProps {
  validationType?: 'email' | 'phone' | 'url' | 'custom';
  customValidation?: ValidationRule[];
}

export function ValidatedInput({
  validationType,
  customValidation = [],
  ...props
}: ValidatedInputProps) {
  const validations: Record<string, ValidationRule[]> = {
    email: [{
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address'
    }],
    phone: [{
      test: (value) => /^[\d\s\-\+\(\)]+$/.test(value) && value.length >= 10,
      message: 'Please enter a valid phone number'
    }],
    url: [{
      test: (value) => /^https?:\/\/.+\..+/.test(value),
      message: 'Please enter a valid URL'
    }],
    custom: customValidation
  };

  return (
    <InputField 
      {...props} 
      validation={validations[validationType || 'custom'] || []}
    />
  );
}

// ============================================
// New: OTPInput for verification codes
// ============================================
interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  error,
  disabled = false
}: OTPInputProps) {
  const inputs = useRef<RNTextInput[]>([]);
  const values = value.split('');

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text;
    
    const newValue = newValues.join('').slice(0, length);
    onChange(newValue);

    // Auto-focus next input
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      <View style={styles.otpInputsRow}>
        {Array.from({ length }, (_, i) => (
          <RNTextInput
            key={i}
            ref={(ref) => inputs.current[i] = ref!}
            style={[
              styles.otpInput,
              error && styles.otpInputError,
              disabled && styles.otpInputDisabled
            ]}
            value={values[i] || ''}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="numeric"
            maxLength={1}
            editable={!disabled}
          />
        ))}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================
const styles = {
  container: {
    marginBottom: spacing.lg,
    position: 'relative' as const,
  },
  staticLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.xs,
  },
  searchContainer: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    ...shadows.sm,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: colors.gray50,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  textArea: {
    paddingTop: spacing.md,
    textAlignVertical: 'top' as const,
  },
  iconLeft: {
    paddingLeft: spacing.md,
  },
  iconRight: {
    paddingRight: spacing.md,
  },
  hint: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: typography.xs,
    color: colors.error,
  },
  bottomRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  charCountWarning: {
    color: colors.warning,
  },
  otpContainer: {
    marginBottom: spacing.lg,
  },
  otpInputsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: spacing.sm,
  },
  otpInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    textAlign: 'center' as const,
    fontSize: typography.xl,
    fontWeight: typography.bold as any,
    backgroundColor: colors.white,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  otpInputDisabled: {
    backgroundColor: colors.gray50,
    opacity: 0.7,
  },
};

// ============================================
// Common validation rules export
// ============================================
export const commonValidations = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message
  }),
  minLength: (length: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= length,
    message: message || `Must be at least ${length} characters`
  }),
  maxLength: (length: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= length,
    message: message || `Must be no more than ${length} characters`
  }),
  email: (message = 'Invalid email address'): ValidationRule => ({
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  phone: (message = 'Invalid phone number'): ValidationRule => ({
    test: (value) => /^[\d\s\-\+\(\)]+$/.test(value) && value.length >= 10,
    message
  }),
  url: (message = 'Invalid URL'): ValidationRule => ({
    test: (value) => /^https?:\/\/.+\..+/.test(value),
    message
  }),
  regex: (pattern: RegExp, message: string): ValidationRule => ({
    test: (value) => pattern.test(value),
    message
  })
};