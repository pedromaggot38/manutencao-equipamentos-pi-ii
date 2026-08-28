import { Type } from '@sinclair/typebox';

const UserRole = Type.Union([
  Type.Literal('user'),
  Type.Literal('admin'),
  Type.Literal('root'),
]);

const UserStatus = Type.Union([
  Type.Literal('pending'),
  Type.Literal('active'),
  Type.Literal('banned'),
  Type.Literal('deactivated'),
]);

export const identifierParamSchema = Type.Object({
  identifier: Type.String({ minLength: 3 }),
});

const passwordConfirmationFields = Type.Object({
  passwordConfirm: Type.String(),
});

const userBaseFields = Type.Object({
  name: Type.String({ minLength: 3 }),
  username: Type.String({ minLength: 3, maxLength: 20 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 4 }),
  avatar: Type.Optional(
    Type.Union([Type.String({ format: 'uri' }), Type.Literal('')]),
  ),
  phone: Type.Optional(
    Type.Union([Type.String({ minLength: 10 }), Type.Literal('')]),
  ),
});

export const adminCreateUserSchema = Type.Intersect([
  userBaseFields,
  passwordConfirmationFields,
  Type.Object({
    role: UserRole,
  }),
]);

export const registerSchema = Type.Intersect([
  userBaseFields,
  passwordConfirmationFields,
]);

export const loginSchema = Type.Object({
  username: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
});

export const updateUserSchema = Type.Partial(
  Type.Intersect([
    Type.Pick(userBaseFields, ['name', 'username', 'email', 'avatar', 'phone']),
    Type.Object({
      role: Type.Optional(UserRole),
      status: Type.Optional(UserStatus),
    }),
  ]),
);

export const updateMeSchema = Type.Partial(
  Type.Pick(userBaseFields, ['name', 'username', 'avatar', 'phone']),
);

export const updateMyPasswordSchema = Type.Object({
  currentPassword: Type.String({ minLength: 1 }),
  newPassword: Type.String({ minLength: 4 }), // Referência manual ao minLength
  passwordConfirm: Type.String({ minLength: 4 }),
});

export const requestEmailChangeSchema = Type.Object({
  newEmail: Type.String({ format: 'email' }),
});

export const verifyOtpSchema = Type.Object({
  token: Type.String({ minLength: 6, maxLength: 6 }),
});

export const forgotPasswordSchema = Type.Object({
  identifier: Type.String({ minLength: 1 }),
});

export const resetPasswordSchema = Type.Object({
  token: Type.String({ minLength: 6, maxLength: 6 }),
  password: Type.String({ minLength: 4 }),
  passwordConfirm: Type.String({ minLength: 4 }),
});

export const deactivateMeSchema = Type.Object({
  password: Type.String({ minLength: 1 }),
});
