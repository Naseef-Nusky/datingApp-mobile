import { Link } from 'react-router-dom';
import RegistrationWizard from '../components/RegistrationWizard';

const Register = () => {
  return (
    <div>
      <RegistrationWizard />
      <div className="absolute top-4 right-4">
        <Link to="/login" className="text-white hover:text-nex-orange transition">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
};

export default Register;

