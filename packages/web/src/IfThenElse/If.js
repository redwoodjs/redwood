import PropTypes from 'prop-types';

const If = props => {
  const thenComponent =
    'length' in props.children
      ? props.children.find(child => child.type.name === 'Then')
      : props.children.type.name === 'Then'
      ? props.children
      : null;

  const elseComponent =
    'length' in props.children
      ? props.children.find(child => child.type.name === 'Else')
      : props.children.type.name === 'Else'
      ? props.children
      : null;

  return props.condition ? thenComponent : elseComponent;
};

If.propTypes = {
  condition: PropTypes.bool
};

export default If;
