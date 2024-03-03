import { Box, Button, Checkbox, Link, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import * as yup from 'yup';

import { yupResolver } from '@hookform/resolvers/yup';
import { useLoginMutation } from '@services';
import { setStorageToken, getStorageToken, clearStorageToken } from '@utils'; // Ajout des fonctions d'accès au stockage du token
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useLoginFormStyle from './LoginForm.style';

type LoginFormDataT = {
    email: string;
    password: string;
    remember: boolean;
};

function LoginForm() {
    const { classes } = useLoginFormStyle();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const LoginFormSchema = yup.object({
        email: yup.string().email(t('validations.email-invalid')).required(t('validations.email-required')),
        password: yup.string().required(t('validations.password-required')),
    });

    const { register, handleSubmit, control } = useForm<LoginFormDataT>({
        reValidateMode: 'onChange',
        resolver: yupResolver(LoginFormSchema),
    });
    const [login] = useLoginMutation();

    const checkAuthenticationOnLoad = async () => {
        const storedToken = getStorageToken();

        if (storedToken) {
            try {
                const isValidToken = await validateTokenLocally();

                if (!isValidToken) {
                    clearStorageToken();
                }
            } catch (error) {
                console.error('Erreur lors de la validation du token :', error);
                clearStorageToken();
            }
        }
    };

    // Fonction factice pour simuler la validation du token côté client.
    const validateTokenLocally = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulez la validation du token côté client ici (peut-être vérifier l'expiration du token).
                resolve(true);
            }, 1000);
        });
    };

    // Appel de la vérification de l'authentification lors du chargement initial de l'application.
    checkAuthenticationOnLoad();

    const onSubmit = async (data: LoginFormDataT) => {
        try {
            const users = await login(data).unwrap();
            
            // Assurez-vous que le tableau d'utilisateurs n'est pas vide
            if (users.length > 0 && users[0].token) {
                const token = users[0].token;
                setStorageToken(token, data.remember);
                navigate('/');
            } else {
                // Gérez le cas où le tableau est vide ou ne contient pas de token
                console.error('Réponse de mutation login invalide :', users);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box className={classes.container}>
            <form id="login-form" noValidate onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    inputProps={{
                        ...register('email'),
                    }}
                    label={t('labels.email')}
                />
                <TextField
                    inputProps={{
                        ...register('password'),
                    }}
                    label={t('labels.password')}
                    type="password"
                    autoComplete="current-password"
                />
                <Link className={classes.checkbox} component={RouterLink} to="/forgot-password" variant="button">
                    {t('buttons.forgot-password')}
                </Link>
                <Box className={classes.checkbox} mb={2} textAlign="left">
                    <Controller
                        control={control}
                        name="remember"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <Checkbox
                                onBlur={onBlur} // notify when input is touched
                                onChange={onChange} // send value to hook form
                                checked={value ?? false}
                                inputRef={ref}
                                inputProps={{
                                    'aria-label': t('labels.remember-me'),
                                }}
                            ></Checkbox>
                        )}
                    />
                </Box>
                <Box mt={6}>
                    <Button type="submit" variant="contained" disableElevation fullWidth>
                        {t('buttons.login')}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}

export default LoginForm;
