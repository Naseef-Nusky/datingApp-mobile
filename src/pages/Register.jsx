import { Link, useLocation } from 'react-router-dom';
import RegistrationWizard from '../components/RegistrationWizard';

const Register = () => {
  const location = useLocation();
  const prefilledEmail = location.state?.prefilledEmail || '';
  const prefilledFirstName = location.state?.prefilledFirstName || '';

  return (
    <div>
      <RegistrationWizard
        prefilledEmail={prefilledEmail}
        prefilledFirstName={prefilledFirstName}
      />
      <div className="absolute top-4 right-4">
        <Link to="/login" className="text-white hover:text-nex-orange transition">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
};

export default Register;

