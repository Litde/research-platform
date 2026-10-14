package pl.research.backend.experiment;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitConfiguration {
    public static final String EXCHANGE = "research.exchanges";
    public static final String QUEUE = "experiment.runs";
    public static final String ROUTING_KEY = "experiment.run";

    @Bean
    Queue experimentRunsQueue() {
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    DirectExchange experimentExchange() {
        return new DirectExchange(EXCHANGE);
    }

    @Bean
    Binding experimentRunsBinding(Queue experimentRunsQueue, DirectExchange experimentExchange) {
        return BindingBuilder.bind(experimentRunsQueue).to(experimentExchange).with(ROUTING_KEY);
    }
}
